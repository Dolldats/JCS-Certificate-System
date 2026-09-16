namespace JCS.Application.Interfaces.Services;

public interface IPlaceholderEngine
{
    string Replace(string template, IReadOnlyDictionary<string, string?> values);
}
