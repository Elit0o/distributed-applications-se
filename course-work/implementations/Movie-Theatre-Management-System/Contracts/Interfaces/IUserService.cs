using Contracts.Interfaces;
using MovieTheatre.Contracts.DTOs.Requests.Users;
using MovieTheatre.Contracts.DTOs.Responses.User;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Contracts.Interfaces
{
    public interface IUserService : IBaseService<User>
    {
        Task<UserPageResponse> GetPagedAllUsers(UserPageRequest userPageRequest);
        Task<bool> CheckUsername(string username);
        User CreateUser(UserRequest userRequest);
        User UpdateUser(UserRequest userReqest, User user);
        UserDetailsResponse MapToResponse(User user);
    }
}
