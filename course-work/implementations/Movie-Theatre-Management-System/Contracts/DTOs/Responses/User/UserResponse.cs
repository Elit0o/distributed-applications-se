namespace MovieTheatre.Contracts.DTOs.Responses.User
{
    public class UserResponse
    {
        public Guid Id { get; set; }
        public string? FName { get; set; }
        public string? LName { get; set; }
        public string? Username { get; set; }
        public DateTime Birthday { get; set; }
        public bool IsAdmin { get; set; } 
    }
}
