using MovieTheatre.Data.Entities;

namespace MovieTheatre.Repository
{
    public interface IUserRepository : IRepository<User>
    {
        Task<bool> CheckUsername(string username);
    }
}
