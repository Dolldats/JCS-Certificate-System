namespace JCS.Application.Interfaces.Services;

public interface IAssetStorageService
{
    Task<string> SaveAsync(Stream content, string fileName, string folder, CancellationToken token = default);
}
