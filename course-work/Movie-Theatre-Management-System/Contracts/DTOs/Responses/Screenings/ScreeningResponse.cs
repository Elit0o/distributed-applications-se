namespace MovieTheatre.Contracts.DTOs.Responses.Screenings
{
    public class ScreeningResponse
    {
        public Guid Id { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string MovieTitle { get; set; }
        public Guid MovieId { get; set; }
        public Guid HallId { get; set; }
        public decimal Price { get; set; }
        public string Type { get; set; }
    }
}
