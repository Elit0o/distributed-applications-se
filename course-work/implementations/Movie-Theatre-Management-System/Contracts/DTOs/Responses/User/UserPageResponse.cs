namespace MovieTheatre.Contracts.DTOs.Responses.User
{
    public class UserPageResponse : PageResponse<UserResponse>
    {
        public string? FName { get; set; }
        public string? LName { get; set; }
        public string? Username { get; set; }
        public string PasswordHash { get; set; }

    }
}
