using MovieTheatre.Contracts.DTOs.Requests.Users;
using MovieTheatre.Contracts.DTOs.Responses.Ticket;
using MovieTheatre.Contracts.DTOs.Responses.User;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;
using MovieTheatre.Repository;
using Microsoft.EntityFrameworkCore;

namespace MovieTheatre.Services
{
    public class UserService : BaseService<User>, IUserService
    {
        private readonly IUserRepository _userRepository;
        public UserService(IUserRepository userRepository, MovieTheatreDbContext dbContext) : base(userRepository, dbContext)
        {
            _userRepository = userRepository;
        }

        public async Task<bool> CheckUsername(string username)
        {
            return await _userRepository.CheckUsername(username);
        }

        public User CreateUser(UserRequest userRequest)
        {
            DateTime modifiedOn = DateTime.UtcNow;
            return new User
            {
                Id = Guid.NewGuid(),
                FName = userRequest.FName,
                LName = userRequest.LName,
                Username = userRequest.Username,
                PasswordHash = userRequest.PasswordHash,
                Birthday = userRequest.Birthday,
                IsAdmin = userRequest.IsAdmin ?? false,
                CreatedOn = modifiedOn,
                UpdatedOn = modifiedOn
            };
        }

        public async Task<UserPageResponse> GetPagedAllUsers(UserPageRequest userPageRequest)
        {
            int page = Math.Max(userPageRequest.Page, 1);
            int pageSize = Math.Clamp(userPageRequest.PageSize, 1, 30);

            var userQuery = _repository.GetAllQueryable();
            if (!string.IsNullOrWhiteSpace(userPageRequest.FName))
            {
                userQuery = userQuery.Where(u => u.FName.Contains(userPageRequest.FName));
            }
            if (!string.IsNullOrWhiteSpace(userPageRequest.LName))
            {
                userQuery = userQuery.Where(u => u.LName.Contains(userPageRequest.LName));
            }
            if (!string.IsNullOrWhiteSpace(userPageRequest.Username))
            {
                userQuery = userQuery.Where(u => u.Username.Contains(userPageRequest.Username));
            }

            userQuery = userPageRequest.IsDescending ? userQuery.OrderByDescending(u => u.Username) : userQuery.OrderBy(u => u.Username);
            var totalCount = await userQuery.CountAsync();
            var items = await userQuery.Skip((page - 1) * pageSize).Take(pageSize).Select(u => new UserResponse{Id = u.Id, Username = u.Username, FName = u.FName, LName = u.LName, Birthday = u.Birthday, IsAdmin = u.IsAdmin}).ToListAsync();

            return new UserPageResponse { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize, IsDescending = userPageRequest.IsDescending, Username = userPageRequest.Username, FName = userPageRequest.FName, LName = userPageRequest.LName };
        }



        public UserDetailsResponse MapToResponse(User user)
        {
            return new UserDetailsResponse { 
                Id = user.Id, 
                FName = user.FName, 
                LName = user.LName, 
                Username = user.Username, 
                PasswordHash = user.PasswordHash, 
                CreatedOn = user.CreatedOn, 
                UpdatedOn = user.UpdatedOn, 
                Birthday = user.Birthday, 
                IsAdmin = user.IsAdmin, 
                Tickets = user.Tickets.Select(t => new TicketResponse 
                { 
                    Id = t.Id,
                    SeatNum = t.SeatNum, 
                    PurchasedAt = t.PurchasedAt, 
                    PhoneNumber = t.PhoneNumber

                }).ToList() };
        }

        public User UpdateUser(UserRequest userReqest, User user)
        {
            user.Username = userReqest.Username;
            user.PasswordHash = userReqest.PasswordHash;
            user.Birthday = userReqest.Birthday;
            if (!string.IsNullOrWhiteSpace(user.FName))
            {
                user.FName = userReqest.FName;
            }
            if (!string.IsNullOrWhiteSpace(user.LName))
            {
                user.LName = userReqest.LName;
            }
            if (userReqest.IsAdmin.HasValue)
            {
                user.IsAdmin = userReqest.IsAdmin.Value;
            }

            user.UpdatedOn = DateTime.UtcNow;
            return user;
        }
    }
}
