using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;

namespace MovieTheatre.Repository
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(MovieTheatreDbContext context) : base(context)
        {
        }

        public async Task<bool> CheckUsername(string username)
        {
            return await _dbSet.AnyAsync(u => u.Username == username);
        }

    }
}
