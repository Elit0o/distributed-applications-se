using MovieTheatre.Data.Entities;

namespace MovieTheatre.Repository
{
    public interface IMovieRepository : IRepository<Movie>
    {
        Task<bool> MovieExistsAsync(string title);
    }
}
