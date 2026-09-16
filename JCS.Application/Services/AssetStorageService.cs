using JCS.Application.Interfaces.Services;

namespace JCS.Application.Services;

public class AssetStorageService : IAssetStorageService
{
    private readonly string _contentRootPath;

    public AssetStorageService(string contentRootPath)
    {
        _contentRootPath = contentRootPath;
    }

    public async Task<string> SaveAsync(Stream content, string fileName, string folder, CancellationToken token = default)
    {
        var safeName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var relativeFolder = Path.Combine("uploads", folder);
        var directory = Path.Combine(_contentRootPath, relativeFolder);
        Directory.CreateDirectory(directory);
        var fullPath = Path.Combine(directory, safeName);
        await using var output = File.Create(fullPath);
        await content.CopyToAsync(output, token);
        return Path.Combine(relativeFolder, safeName).Replace("\\", "/");
    }
}
