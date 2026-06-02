namespace MovieTheatre.Contracts.DTOs.Responses.Ticket
{
    public class TicketPageResponse : PageResponse<TicketResponse>
    {
        public string MovieTitle { get; set; }
    }
}
