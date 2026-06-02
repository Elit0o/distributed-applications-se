namespace MovieTheatre.Contracts.DTOs.Requests.Users
{
    public class UserPageRequest : PageRequest
    {
        public string? FName { get; set; }
        public string? LName { get; set; }
        public string? Username { get; set; }
    }
}
