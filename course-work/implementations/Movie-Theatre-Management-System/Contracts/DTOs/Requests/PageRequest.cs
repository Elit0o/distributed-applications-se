namespace MovieTheatre.Contracts.DTOs.Requests
{
    public class PageRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public bool IsDescending { get; set; } = true;

        public int PageNumber
        {
            get => Page;
            set => Page = value;
        }

        public bool IsAscending
        {
            get => !IsDescending;
            set => IsDescending = !value;
        }

        public string? SortBy { get; set; }
    }
}
