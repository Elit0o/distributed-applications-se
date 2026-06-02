namespace MovieTheatre.Contracts.DTOs.Requests.Screenings
{
    public class ScreeningPageRequest : PageRequest
    {
        public string? Title { get; set; }
        public string? Genre { get; set; }
        public DateTime? Date { get; set; }

        public string? Type { get; set; }
    }
}
