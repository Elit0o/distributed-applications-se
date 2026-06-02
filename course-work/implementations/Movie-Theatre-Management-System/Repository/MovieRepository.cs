using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;

namespace MovieTheatre.Repository
{
    public class MovieRepository : Repository<Movie>, IMovieRepository
    {
        public MovieRepository(MovieTheatreDbContext context) : base(context)
        {
        }

        public Task<bool> MovieExistsAsync(string title)
        {
            return _dbSet.AnyAsync(m => m.Title == title);
        }
    }
}
