using MovieTheatre.Data.Entities;

namespace MovieTheatre.Contracts.Interfaces
{
    public interface ITokenService
    {
        public string CreateToken(User user);
    }
}
