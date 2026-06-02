using MovieTheatre.Contracts.DTOs.Responses.Ticket;

namespace MovieTheatre.Contracts.DTOs.Responses.User
{
    public class UserDetailsResponse
    {
        public Guid Id { get; set; }
        public string? FName { get; set; }
        public string? LName { get; set; }
        public required string Username { get; set; }
        public required string PasswordHash { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime UpdatedOn { get; set; }
        public DateTime Birthday { get; set; }
        public bool IsAdmin { get; set; } = false;
        public virtual ICollection<TicketResponse> Tickets { get; set; } = new List<TicketResponse>();
    }
}
