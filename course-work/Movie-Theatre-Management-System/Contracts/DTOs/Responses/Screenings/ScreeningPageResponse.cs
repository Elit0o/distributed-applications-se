namespace MovieTheatre.Contracts.DTOs.Responses.Screenings
{
    public class ScreeningPageResponse : PageResponse<ScreeningResponse>
    {
        public string? Type { get; set; }
    }
}
