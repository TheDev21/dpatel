using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigin = builder.Configuration["Cors:AllowedOrigin"] ?? "https://weirdlittlegames.lol";
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:Default configuration.");
var statsApiKey = builder.Configuration["Stats:ApiKey"];
var knownSlugs = new HashSet<string>(
    builder.Configuration.GetSection("KnownGameSlugs").Get<string[]>() ?? Array.Empty<string>(),
    StringComparer.Ordinal);

builder.Services.AddCors(options =>
{
    options.AddPolicy("WeirdLittleGames", policy =>
    {
        policy.WithOrigins(allowedOrigin)
              .AllowAnyHeader()
              .WithMethods("GET", "POST");
    });
});

// Rate limiting is keyed by remote IP only inside this in-memory limiter.
// The IP is never persisted to a log or database anywhere in this app --
// it only exists transiently to decide "reject or allow" for a moment.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("vote", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy("read", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

var app = builder.Build();

app.UseCors("WeirdLittleGames");
app.UseRateLimiter();

// ---- one-time startup: make sure every known game has a row ----
await using (var conn = new MySqlConnection(connectionString))
{
    await conn.OpenAsync();
    foreach (var slug in knownSlugs)
    {
        await using var cmd = new MySqlCommand(
            "INSERT IGNORE INTO games (slug, likes, dislikes) VALUES (@slug, 0, 0)", conn);
        cmd.Parameters.AddWithValue("@slug", slug);
        await cmd.ExecuteNonQueryAsync();
    }
}

var slugPattern = new Regex("^[a-z0-9-]{1,64}$", RegexOptions.Compiled);

static bool IsValidGuid(string? value) => Guid.TryParse(value, out _);

// ---- GET /api/games/stats ----
app.MapGet("/api/games/stats", async (HttpContext ctx) =>
{
    if (!string.IsNullOrEmpty(statsApiKey))
    {
        if (!ctx.Request.Headers.TryGetValue("X-Admin-Key", out var provided) ||
            provided.ToString() != statsApiKey)
        {
            return Results.Unauthorized();
        }
    }

    await using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    await using var cmd = new MySqlCommand(
        "SELECT slug, likes, dislikes FROM games ORDER BY likes DESC, slug ASC", conn);
    await using var reader = await cmd.ExecuteReaderAsync();

    var results = new List<object>();
    while (await reader.ReadAsync())
    {
        results.Add(new
        {
            game = reader.GetString(0),
            likes = reader.GetInt32(1),
            dislikes = reader.GetInt32(2)
        });
    }
    return Results.Ok(results);
}).RequireRateLimiting("read");

// ---- GET /api/games/{slug}/votes ----
app.MapGet("/api/games/{slug}/votes", async (string slug, string? voterId, HttpContext ctx) =>
{
    if (!slugPattern.IsMatch(slug)) return Results.BadRequest(new { error = "invalid game slug" });

    await using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();

    await using var gameCmd = new MySqlCommand(
        "SELECT likes, dislikes FROM games WHERE slug = @slug", conn);
    gameCmd.Parameters.AddWithValue("@slug", slug);
    await using var reader = await gameCmd.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return Results.NotFound(new { error = "unknown game" });

    var likes = reader.GetInt32(0);
    var dislikes = reader.GetInt32(1);
    await reader.CloseAsync();

    string? userVote = null;
    if (IsValidGuid(voterId))
    {
        await using var voteCmd = new MySqlCommand(
            "SELECT vote FROM votes WHERE game_slug = @slug AND voter_id = @voterId", conn);
        voteCmd.Parameters.AddWithValue("@slug", slug);
        voteCmd.Parameters.AddWithValue("@voterId", voterId);
        var result = await voteCmd.ExecuteScalarAsync();
        if (result is string v) userVote = v;
    }

    return Results.Ok(new { game = slug, likes, dislikes, userVote });
}).RequireRateLimiting("read");

// ---- POST /api/games/{slug}/vote ----
app.MapPost("/api/games/{slug}/vote", async (string slug, VoteRequest? body, HttpContext ctx) =>
{
    if (!slugPattern.IsMatch(slug)) return Results.BadRequest(new { error = "invalid game slug" });
    if (body is null) return Results.BadRequest(new { error = "missing request body" });
    if (body.Vote != "like" && body.Vote != "dislike")
        return Results.BadRequest(new { error = "vote must be exactly \"like\" or \"dislike\"" });
    if (!IsValidGuid(body.VoterId))
        return Results.BadRequest(new { error = "missing or invalid voterId" });

    await using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    await using var tx = await conn.BeginTransactionAsync();

    // confirm the game exists
    await using (var gameCheck = new MySqlCommand("SELECT 1 FROM games WHERE slug = @slug FOR UPDATE", conn, (MySqlTransaction)tx))
    {
        gameCheck.Parameters.AddWithValue("@slug", slug);
        var exists = await gameCheck.ExecuteScalarAsync();
        if (exists is null)
        {
            await tx.RollbackAsync();
            return Results.NotFound(new { error = "unknown game" });
        }
    }

    string? existingVote = null;
    await using (var existingCmd = new MySqlCommand(
        "SELECT vote FROM votes WHERE game_slug = @slug AND voter_id = @voterId FOR UPDATE", conn, (MySqlTransaction)tx))
    {
        existingCmd.Parameters.AddWithValue("@slug", slug);
        existingCmd.Parameters.AddWithValue("@voterId", body.VoterId);
        var result = await existingCmd.ExecuteScalarAsync();
        if (result is string v) existingVote = v;
    }

    if (existingVote is null)
    {
        // brand new vote
        await using var insertVote = new MySqlCommand(
            "INSERT INTO votes (game_slug, voter_id, vote) VALUES (@slug, @voterId, @vote)", conn, (MySqlTransaction)tx);
        insertVote.Parameters.AddWithValue("@slug", slug);
        insertVote.Parameters.AddWithValue("@voterId", body.VoterId);
        insertVote.Parameters.AddWithValue("@vote", body.Vote);
        await insertVote.ExecuteNonQueryAsync();

        var column = body.Vote == "like" ? "likes" : "dislikes";
        await using var bump = new MySqlCommand(
            $"UPDATE games SET {column} = {column} + 1 WHERE slug = @slug", conn, (MySqlTransaction)tx);
        bump.Parameters.AddWithValue("@slug", slug);
        await bump.ExecuteNonQueryAsync();
    }
    else if (existingVote != body.Vote)
    {
        // switching like <-> dislike: move one from the old column to the new one
        await using var updateVote = new MySqlCommand(
            "UPDATE votes SET vote = @vote WHERE game_slug = @slug AND voter_id = @voterId", conn, (MySqlTransaction)tx);
        updateVote.Parameters.AddWithValue("@vote", body.Vote);
        updateVote.Parameters.AddWithValue("@slug", slug);
        updateVote.Parameters.AddWithValue("@voterId", body.VoterId);
        await updateVote.ExecuteNonQueryAsync();

        var oldColumn = existingVote == "like" ? "likes" : "dislikes";
        var newColumn = body.Vote == "like" ? "likes" : "dislikes";
        await using var swap = new MySqlCommand(
            $"UPDATE games SET {oldColumn} = GREATEST({oldColumn} - 1, 0), {newColumn} = {newColumn} + 1 WHERE slug = @slug",
            conn, (MySqlTransaction)tx);
        swap.Parameters.AddWithValue("@slug", slug);
        await swap.ExecuteNonQueryAsync();
    }
    // else: same vote clicked again -> no-op

    await tx.CommitAsync();

    await using var totalsCmd = new MySqlCommand(
        "SELECT likes, dislikes FROM games WHERE slug = @slug", conn);
    totalsCmd.Parameters.AddWithValue("@slug", slug);
    await using var totalsReader = await totalsCmd.ExecuteReaderAsync();
    await totalsReader.ReadAsync();

    return Results.Ok(new
    {
        game = slug,
        likes = totalsReader.GetInt32(0),
        dislikes = totalsReader.GetInt32(1),
        userVote = body.Vote
    });
}).RequireRateLimiting("vote");

app.Run();

record VoteRequest(string Vote, string VoterId);
