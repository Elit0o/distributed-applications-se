import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7095/api';

function decodeJwt(token) {
    try {
        const [, payload] = token.split('.');
        if (!payload) return null;
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function formatLocalDateTime(date) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const iso = date.toISOString();
    return iso.substring(0, 16);
}

function datetimeLocalToUTC(datetimeLocalString) {
    if (!datetimeLocalString) return null;
    const [datePart, timePart] = datetimeLocalString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
}

function extractUTCDateFromISO(isoString) {
    if (!isoString) return '';
    return isoString.substring(0, 10);
}

function normaliseToUTC(dateString) {
    if (!dateString) return dateString;
    const s = String(dateString).trim();
    if (/[Z]$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00Z';
    return s + 'Z';
}
function displayUTCDate(dateString, options = {}) {
    if (!dateString) return '';
    const d = new Date(normaliseToUTC(dateString));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', { timeZone: 'UTC', ...options });
}

function dateStringToUTCISO(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

function getProblemDetailsMessage(err) {
    const data = err?.response?.data;
    if (!data) return err?.message || 'Request failed.';
    const title = data.title || data.Title;
    const detail = data.detail || data.Detail;
    if (title && detail) return `${title}: ${detail}`;
    if (title) return title;
    if (detail) return detail;
    if (data.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors).flat().filter(Boolean)[0];
        if (first) return String(first);
    }
    return typeof data === 'string' ? data : 'Request failed.';
}

function isValidMovieForm(form) {
    const errors = {};
    const title = (form.title || '').trim();
    const genre = (form.genre || '').trim();
    const description = (form.description || '').trim();
    const releaseDate = form.releaseDate ? new Date(form.releaseDate) : null;
    const durationMinutes = Number(form.durationMinutes);
    const rating = form.rating === '' ? null : Number(form.rating);

    if (!title) errors.title = 'Title is required.';
    else if (title.length < 2) errors.title = 'Title must be at least 2 characters.';
    else if (title.length > 50) errors.title = 'Title must be at most 50 characters.';

    if (!genre) errors.genre = 'Genre is required.';
    else if (genre.length < 2) errors.genre = 'Genre must be at least 2 characters.';
    else if (genre.length > 20) errors.genre = 'Genre must be at most 20 characters.';

    if (!releaseDate || Number.isNaN(releaseDate.getTime())) errors.releaseDate = 'Release date is required.';
    else {
        const [year, month, day] = form.releaseDate.split('-').map(Number);
        const releaseDateUTC = new Date(Date.UTC(year, month - 1, day));
        const nowUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
        if (releaseDateUTC > nowUTC) errors.releaseDate = 'Release date cannot be in the future.';
    }

    if (form.durationMinutes === '' || Number.isNaN(durationMinutes)) errors.durationMinutes = 'Duration is required.';
    else if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) errors.durationMinutes = 'Duration must be a positive number.';

    if (!description) errors.description = 'Description is required.';
    else if (description.length < 5) errors.description = 'Description must be at least 5 characters.';
    else if (description.length > 1000) errors.description = 'Description must be at most 1000 characters.';

    if (rating !== null) {
        if (Number.isNaN(rating)) errors.rating = 'Rating must be a number.';
        else if (rating < 0 || rating > 5) errors.rating = 'Rating must be between 0 and 5.';
    }
    return errors;
}

function isValidHallForm(form) {
    const errors = {};
    const hallNum = Number(form.hallNum);
    const seatsCount = Number(form.seatsCount);

    if (form.hallNum === '' || Number.isNaN(hallNum)) errors.hallNum = 'Hall number is required.';
    else if (!Number.isFinite(hallNum) || hallNum < 0 || hallNum > 255) errors.hallNum = 'Hall number must be between 0 and 255.';

    if (form.seatsCount === '' || Number.isNaN(seatsCount)) errors.seatsCount = 'Seat count is required.';
    else if (!Number.isFinite(seatsCount) || seatsCount < 0 || seatsCount > 65535) errors.seatsCount = 'Seat count must be between 0 and 65535.';

    if (form.soundSystem === '' || form.soundSystem === null || typeof form.soundSystem === 'undefined') {
        errors.soundSystem = 'Sound system is required.';
    }
    return errors;
}

function isValidScreeningForm(form) {
    const errors = {};
    const price = form.price === '' ? NaN : Number(form.price);
    const start = form.startTime ? new Date(form.startTime) : null;
    const end = form.endTime ? new Date(form.endTime) : null;

    if (!form.movieId) errors.movieId = 'Movie is required.';
    if (!form.hallId) errors.hallId = 'Hall is required.';
    if (!start || Number.isNaN(start.getTime())) errors.startTime = 'Start time is required.';
    if (!end || Number.isNaN(end.getTime())) errors.endTime = 'End time is required.';
    if (Number.isNaN(price)) errors.price = 'Price is required.';
    else {
        const priceStr = String(form.price).trim();
        const match = priceStr.match(/^\d+(\.\d{1,2})?$/);
        if (!match) errors.price = 'Price must be a valid number (whole or decimal with up to 2 digits).';
        else if (price <= 0) errors.price = 'Price must be greater than 0.';
    }
    return errors;
}

function isValidUserForm(form) {
    const errors = {};

    const fname = (form.fName || '').trim();
    const lname = (form.lName || '').trim();
    const username = (form.username || '').trim();
    const password = (form.passwordHash || '').trim();

    if (!fname) {
        errors.fname = 'First name is required.';
    }

    if (!lname) {
        errors.lname = 'Last name is required.';
    }

    if (!username) {
        errors.username = 'Username is required.';
    } else if (username.length < 3) {
        errors.username =
            'Username must be at least 3 characters.';
    }

    if (!password) {
        errors.password =
            'Password is required.';
    } else if (password.length < 6) {
        errors.password =
            'Password must be at least 6 characters.';
    }

    return errors;
}

function useAlert(timeout = 4000) {
    const [msg, setMsg] = useState('');
    const timerRef = React.useRef(null);
    const show = (text) => {
        setMsg(text);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setMsg(''), timeout);
    };
    const clear = () => { setMsg(''); if (timerRef.current) clearTimeout(timerRef.current); };
    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
    return [msg, show, clear];
}

function AlertBlock({ type, message, onDismiss }) {
    if (!message) return null;
    const isError = type === 'error';
    const isWarning = type === 'warning';
    const bg = isError ? '#ff4d4d33' : isWarning ? '#f6ad5533' : '#2ec4b633';
    const border = isError ? '#ff4d4d' : isWarning ? '#f6ad55' : '#2ec4b6';
    const color = isError ? '#ff9999' : isWarning ? '#fbd38d' : '#7bf1a8';
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, color, padding: '12px 40px 12px 12px', borderRadius: '8px', marginBottom: '10px', position: 'relative', animation: 'fadeInAlert 0.25s ease' }}>
            <style>{`@keyframes fadeInAlert { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {message}
            {onDismiss && (
                <button onClick={onDismiss} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
            )}
        </div>
    );
}

function PaginationBar({ page, totalPages, pageSize, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', marginTop: '15px' }}>
            <button
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(page - 1, 1))}
                style={{ padding: '8px 15px', backgroundColor: '#232834', color: '#fff', border: 'none', borderRadius: '6px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
                ◀ Prev
            </button>
            <span style={{ color: '#deff9a', fontWeight: 'bold' }}>
                Page {page} / {totalPages}
            </span>
            <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(page + 1, totalPages))}
                style={{ padding: '8px 15px', backgroundColor: '#232834', color: '#fff', border: 'none', borderRadius: '6px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
            >
                Next ▶
            </button>
            <span style={{ color: '#a0aec0', fontSize: 13 }}>PageSize: {pageSize}</span>
        </div>
    );
}

function InlineError({ message }) {
    if (!message) return null;
    return <span style={{ color: '#ff9999', fontSize: '12px', marginTop: '-10px', display: 'block' }}>{message}</span>;
}

export default function App() {
    document.body.style.margin = '0';
    document.body.style.padding = '20';
    document.body.style.background = '#0f1115';

    const [isLoginView, setIsLoginView] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    const [serverError, showError, clearError] = useAlert(5000);
    const [success, showSuccess, clearSuccess] = useAlert(4000);

    const setServerError = (msg) => { if (msg) showError(msg); else clearError(); };
    const setSuccess = (msg) => { if (msg) showSuccess(msg); else clearSuccess(); };

    const [currentUser, setCurrentUser] = useState(null);
    const [profileForm, setProfileForm] = useState({ fName: '', lName: '', birthday: '', username: '', newPassword: '' });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileEditing, setProfileEditing] = useState(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthday, setBirthday] = useState('');

    const [movies, setMovies] = useState([]);
    const [halls, setHalls] = useState([]);
    const [adminMovies, setAdminMovies] = useState([]);
    const [adminHalls, setAdminHalls] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [screenings, setScreenings] = useState([]);
    const [allScreenings, setAllScreenings] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [dynamicTakenSeats, setDynamicTakenSeats] = useState({});

    const [ticketSearch, setTicketSearch] = useState('');
    const [ticketSortBy, setTicketSortBy] = useState('date');
    const [ticketSortAsc, setTicketSortAsc] = useState(true);

    const [activeTab, setActiveTab] = useState('movies');
    const [selectedDay, setSelectedDay] = useState('');
    const [activeScreening, setActiveScreening] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [weekDays, setWeekDays] = useState([]);

    const [screeningTitleQuery, setScreeningTitleQuery] = useState('');
    const [screeningGenreQuery, setScreeningGenreQuery] = useState('');
    const [screeningSortBy, setScreeningSortBy] = useState('StartTime');
    const [screeningIsAscending, setScreeningIsAscending] = useState(true);
    const [screeningPageNumber, setScreeningPageNumber] = useState(1);
    const [screeningsPageMeta, setScreeningsPageMeta] = useState({ totalPages: 1, totalCount: 0 });
    const screeningPageSize = 10;

    const [adminSubTab, setAdminSubTab] = useState('movies');

    const [adminMovieTitleQuery, setAdminMovieTitleQuery] = useState('');
    const [movieSortBy, setMovieSortBy] = useState('ReleaseDate');
    const [movieIsAscending, setMovieIsAscending] = useState(false);
    const [moviePageNumber, setMoviePageNumber] = useState(1);
    const [moviesPageMeta, setMoviesPageMeta] = useState({ totalPages: 1, totalCount: 0 });
    const moviePageSize = 10;

    const [adminHallNumQuery, setAdminHallNumQuery] = useState('');
    const [hallSortBy, setHallSortBy] = useState('SeatsCount');
    const [hallIsAscending, setHallIsAscending] = useState(true);
    const [hallPageNumber, setHallPageNumber] = useState(1);
    const [hallsPageMeta, setHallsPageMeta] = useState({ totalPages: 1, totalCount: 0 });
    const hallPageSize = 10;

    const [adminScreeningQuery, setAdminScreeningQuery] = useState(''); 
    const [adminScreeningSortBy, setAdminScreeningSortBy] = useState('HallNum');
    const [adminScreeningIsAscending, setAdminScreeningIsAscending] = useState(true);
    const [adminScreeningPageNumber, setAdminScreeningPageNumber] = useState(1);
    const [adminScreeningsMeta, setAdminScreeningsMeta] = useState({ totalPages: 1, totalCount: 0 });
    const [adminScreenings, setAdminScreenings] = useState([]);
    const adminScreeningPageSize = 10;

    const [editingMovieId, setEditingMovieId] = useState(null);
    const [editingHallId, setEditingHallId] = useState(null);
    const [editingScreeningId, setEditingScreeningId] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);

    const [movieForm, setMovieForm] = useState({ title: '', genre: '', releaseDate: '', durationMinutes: '', description: '', rating: '0' });
    const [hallForm, setHallForm] = useState({ hallNum: '', seatsCount: '', is3D: false, soundSystem: 'Standard', isPremium: false });
    const [screeningForm, setScreeningForm] = useState({ movieId: '', hallId: '', startTime: '', endTime: '', price: '', type: '0' });
    const [newUserAdminForm, setNewUserAdminForm] = useState({ username: '', passwordHash: '', fName: '', lName: '', birthday: '', isAdmin: false });
    const [originalUserPasswordHash, setOriginalUserPasswordHash] = useState('');

    const [adminUserSearchQuery, setAdminUserSearchQuery] = useState('');
    const [adminUserSortBy, setAdminUserSortBy] = useState('Username');
    const [adminUserIsAscending, setAdminUserIsAscending] = useState(true);

    const [fieldErrors, setFieldErrors] = useState({});

    const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

    const SCREENING_TYPES = [
        { value: 0, label: "Standard 2D" }, { value: 1, label: "Standard 3D" },
        { value: 2, label: "IMAX" }, { value: 3, label: "IMAX 3D" },
        { value: 4, label: "Dolby Cinema" }, { value: 5, label: "4DX" },
        { value: 6, label: "Atmos" }, { value: 7, label: "Subtitled" },
        { value: 8, label: "Dubbed" }, { value: 9, label: "VIP" },
        { value: 10, label: "Premiere" }
    ];

    const SOUND_SYSTEMS = [
        { value: "Standard", label: "Standard" }, { value: "DolbyAtmos", label: "Dolby Atmos" },
        { value: "IMAX12ChannelSound", label: "IMAX 12 Channel" },
        { value: "DTSX", label: "DTS:X" }, { value: "Auro3D", label: "Auro 3D" }
    ];

    useEffect(() => {
        const days = [];
        const now = new Date();
        const sy = now.getFullYear();
        const sm = now.getMonth();
        const sd = now.getDate();
        for (let i = 0; i < 7; i++) {
            const d = new Date(sy, sm, sd + i);
            const y = d.getFullYear();
            const mo = d.getMonth();
            const day = d.getDate();
            const isoString = [y, String(mo + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
            const utcLabel = new Date(Date.UTC(y, mo, day));
            const label = utcLabel.toLocaleString('en-US', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
            days.push({ label, isoString });
        }
        setWeekDays(days);
        if (days.length > 0) setSelectedDay(days[0].isoString);
    }, []);

    useEffect(() => {
        if (!token) return;
        const payload = decodeJwt(token);
        const admin = payload?.isAdmin === true || String(payload?.isAdmin).toLowerCase() === 'true';
        setIsAdmin(admin);
        localStorage.setItem('isAdmin', admin ? 'true' : 'false');
    }, [token]);

    useEffect(() => {
        if (!token) return;
        fetchMoviesForProgram();
        (async () => {
            const allHalls = await fetchHallsForSelect();
            setHalls(allHalls);
        })();
        fetchMyTickets();
        fetchCurrentUser();
    }, [token, isAdmin]);

    useEffect(() => {
        if (!token || !selectedDay) return;
        setActiveScreening(null);
        setSelectedSeat(null);
        fetchScreeningsProgram();
    }, [selectedDay, screeningPageNumber, screeningTitleQuery, screeningGenreQuery, screeningSortBy, screeningIsAscending, token]);

    useEffect(() => {
        if (!activeScreening) return;
        setSelectedSeat(null);
        fetchTakenSeatsForScreening(activeScreening);
    }, [activeScreening]);

    useEffect(() => {
        if (screeningForm.startTime && screeningForm.movieId) {
            const movie = movies.find((m) => String(m.id ?? m.Id) === String(screeningForm.movieId));
            const duration = movie ? Number(movie.durationMinutes ?? movie.DurationMinutes ?? 0) : 0;
            if (duration > 0) {
                const startDate = datetimeLocalToUTC(screeningForm.startTime);
                if (startDate && !Number.isNaN(startDate.getTime())) {
                    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
                    setScreeningForm((prev) => ({ ...prev, endTime: formatLocalDateTime(endDate) }));
                }
            }
        }
    }, [screeningForm.startTime, screeningForm.movieId, movies]);

    const apiGet = async (url) => axios.get(url, { headers: authHeaders });
    const apiPost = async (url, body, extraHeaders = {}) => axios.post(url, body, { headers: { ...authHeaders, ...extraHeaders } });
    const apiPut = async (url, body) => axios.put(url, body, { headers: authHeaders });
    const apiDelete = async (url) => axios.delete(url, { headers: authHeaders });

    const handleLogin = async (e) => {
        e.preventDefault(); setServerError(''); setSuccess('');
        try {
            const formData = new FormData();
            formData.append('Username', username);
            formData.append('PasswordHash', password);
            const response = await axios.post(`${API_BASE_URL}/Auth`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const jwtToken = response.data?.token || response.data?.Token;
            if (!jwtToken) throw new Error('Missing token');
            setToken(jwtToken);
            const payload = decodeJwt(jwtToken);
            const admin = payload?.isAdmin === true || String(payload?.isAdmin).toLowerCase() === 'true';
            setIsAdmin(admin);
            localStorage.setItem('token', jwtToken);
            localStorage.setItem('isAdmin', admin ? 'true' : 'false');
            setSuccess('Welcome back!');
            clearAuthForm();
        } catch { setServerError('Invalid username or password.'); }
    };

    const handleRegister = async (e) => {
        e.preventDefault(); setServerError(''); setSuccess('');
        const payload = { fName: firstName, lName: lastName, username, passwordHash: password, birthday: dateStringToUTCISO(birthday), isAdmin: false };
        try {
            await axios.post(`${API_BASE_URL}/User`, payload);
            setSuccess('Registration successful!');
            setIsLoginView(true);
            clearAuthForm();
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const clearAuthForm = () => { setUsername(''); setPassword(''); setFirstName(''); setLastName(''); setBirthday(''); };
    const handleLogout = () => { setToken(''); setIsAdmin(false); setCurrentUser(null); localStorage.clear(); clearAuthForm(); setDynamicTakenSeats({}); };

    const fetchMoviesForProgram = async () => {
        try {
            let page = 1; const all = [];
            for (let i = 0; i < 20; i++) {
                const { data } = await apiGet(`${API_BASE_URL}/Movie?PageNumber=${page}&PageSize=30&SortBy=Rating&IsAscending=false`);
                const payload = data || {}; const items = payload.items || payload.Items || [];
                all.push(...items);
                if (page >= (payload.totalPages ?? payload.TotalPages ?? 1)) break;
                page += 1;
            }
            setMovies(all);
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchHallsForSelect = async (pageSize = 30) => {
        let page = 1; const all = [];
        for (let i = 0; i < 20; i++) {
            const { data } = await apiGet(`${API_BASE_URL}/Hall?PageNumber=${page}&PageSize=${pageSize}`);
            const payload = data || {}; const items = payload.items || payload.Items || [];
            all.push(...items);
            if (page >= (payload.totalPages ?? payload.TotalPages ?? 1)) break;
            page += 1;
        }
        return all;
    };

    const fetchMoviesAdmin = async () => {
        try {
            const { data } = await apiGet(`${API_BASE_URL}/Movie?PageNumber=1&PageSize=200`);
            let items = data?.items || data?.Items || [];

            if (adminMovieTitleQuery) {
                const q = adminMovieTitleQuery.toLowerCase();
                items = items.filter(m => (m.title || m.Title || '').toLowerCase().includes(q));
            }

            items.sort((a, b) => {
                let valA, valB;
                if (movieSortBy === 'Rating') {
                    valA = Number(a.rating ?? a.Rating ?? 0);
                    valB = Number(b.rating ?? b.Rating ?? 0);
                } else {
                    valA = new Date(a.releaseDate || a.ReleaseDate || 0).getTime();
                    valB = new Date(b.releaseDate || b.ReleaseDate || 0).getTime();
                }
                if (valA < valB) return movieIsAscending ? -1 : 1;
                if (valA > valB) return movieIsAscending ? 1 : -1;
                return 0;
            });

            setMoviesPageMeta({ totalCount: items.length, totalPages: Math.ceil(items.length / moviePageSize) || 1 });
            const start = (moviePageNumber - 1) * moviePageSize;
            setAdminMovies(items.slice(start, start + moviePageSize));
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchHallsPage = async () => {
        if (!isAdmin) return;
        try {
            const { data } = await apiGet(`${API_BASE_URL}/Hall?PageNumber=1&PageSize=200`);
            let items = data?.items || data?.Items || [];

            if (adminHallNumQuery) {
                items = items.filter(h => String(h.hallNum ?? h.HallNum ?? '').includes(adminHallNumQuery));
            }

            items.sort((a, b) => {
                let valA, valB;
                if (hallSortBy === 'SeatsCount') {
                    valA = Number(a.seatsCount ?? a.SeatsCount ?? 0);
                    valB = Number(b.seatsCount ?? b.SeatsCount ?? 0);
                } else {
                    valA = Number(a.hallNum ?? a.HallNum ?? 0);
                    valB = Number(b.hallNum ?? b.HallNum ?? 0);
                }
                if (valA < valB) return hallIsAscending ? -1 : 1;
                if (valA > valB) return hallIsAscending ? 1 : -1;
                return 0;
            });

            setHallsPageMeta({ totalCount: items.length, totalPages: Math.ceil(items.length / hallPageSize) || 1 });
            const start = (hallPageNumber - 1) * hallPageSize;
            setAdminHalls(items.slice(start, start + hallPageSize));
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchScreeningsProgram = async () => {
        try {
            const dateQuery = selectedDay ? encodeURIComponent(selectedDay) : '';
            const { data } = await apiGet(`${API_BASE_URL}/Screening?PageNumber=${screeningPageNumber}&PageSize=${screeningPageSize}&Date=${dateQuery}&Title=${encodeURIComponent(screeningTitleQuery)}&Genre=${encodeURIComponent(screeningGenreQuery)}&SortBy=${encodeURIComponent(screeningSortBy)}&IsAscending=${screeningIsAscending}`);
            const payload = data || {}; setScreenings(payload.items || payload.Items || []);
            setScreeningsPageMeta({ totalCount: payload.totalCount ?? payload.TotalCount ?? 0, totalPages: payload.totalPages ?? payload.TotalPages ?? 1 });
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchAdminScreenings = async () => {
        if (!isAdmin) return;
        try {
            const { data } = await apiGet(`${API_BASE_URL}/Screening?PageNumber=1&PageSize=500`);
            let items = data?.items || data?.Items || [];

            if (adminScreeningQuery) {
                const q = adminScreeningQuery.toLowerCase();
                items = items.filter(s => {
                    const mTitle = (s.movieTitle || s.MovieTitle || '').toLowerCase();
                    const hallObj = halls.find(h => String(h.id ?? h.Id) === String(s.hallId || s.HallId));
                    const hNum = String(hallObj?.hallNum ?? hallObj?.HallNum ?? '');
                    return mTitle.includes(q) || hNum.includes(q);
                });
            }

            items.sort((a, b) => {
                let valA = 0, valB = 0;
                const hallA = halls.find(h => String(h.id ?? h.Id) === String(a.hallId || a.HallId));
                const hallB = halls.find(h => String(h.id ?? h.Id) === String(b.hallId || b.HallId));

                if (adminScreeningSortBy === 'HallNum') {
                    valA = Number(hallA?.hallNum ?? hallA?.HallNum ?? 0);
                    valB = Number(hallB?.hallNum ?? hallB?.HallNum ?? 0);
                } else if (adminScreeningSortBy === 'SeatsCount') {
                    valA = Number(hallA?.seatsCount ?? hallA?.SeatsCount ?? 0);
                    valB = Number(hallB?.seatsCount ?? hallB?.SeatsCount ?? 0);
                } else {
                    valA = a.startTime || a.StartTime;
                    valB = b.startTime || b.StartTime;
                }

                if (valA < valB) return adminScreeningIsAscending ? -1 : 1;
                if (valA > valB) return adminScreeningIsAscending ? 1 : -1;
                return 0;
            });

            setAdminScreeningsMeta({ totalCount: items.length, totalPages: Math.ceil(items.length / adminScreeningPageSize) || 1 });
            const start = (adminScreeningPageNumber - 1) * adminScreeningPageSize;
            setAdminScreenings(items.slice(start, start + adminScreeningPageSize));
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchAdminUsers = async () => {
        if (!isAdmin) return;
        try {
            const { data } = await apiGet(`${API_BASE_URL}/User?PageNumber=1&PageSize=50`);
            let users = data?.items || data?.Items || data || [];

            if (adminUserSearchQuery) {
                users = users.filter(u =>
                    (u.username || u.Username || '').toLowerCase().includes(adminUserSearchQuery.toLowerCase())
                );
            }

            users.sort((a, b) => {
                let aVal, bVal;
                if (adminUserSortBy === 'Username') {
                    aVal = (a.username || a.Username || '').toLowerCase();
                    bVal = (b.username || b.Username || '').toLowerCase();
                } else if (adminUserSortBy === 'Role') {
                    aVal = (a.isAdmin || a.IsAdmin) ? 1 : 0;
                    bVal = (b.isAdmin || b.IsAdmin) ? 1 : 0;
                } else if (adminUserSortBy === 'Birthday') {
                    aVal = new Date(a.birthday || a.Birthday || 0).getTime();
                    bVal = new Date(b.birthday || b.Birthday || 0).getTime();
                }
                return adminUserIsAscending ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });

            setAdminUsers(users);
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchTakenSeatsForScreening = async (screening) => {
        const scrId = screening?.id || screening?.Id;
        if (!scrId) return;
        try {
            const { data } = await apiGet(`${API_BASE_URL}/Ticket/screening/${scrId}/seats`);
            const seats = Array.isArray(data) ? data.map(Number) : [];
            setDynamicTakenSeats((prev) => ({ ...prev, [scrId]: seats }));
        } catch (err) { console.error("Failed to fetch global seats state:", err); }
    };

    const fetchMyTickets = async () => {
        try {
            const { data } = await apiGet(`${API_BASE_URL}/Ticket?PageNumber=1&PageSize=100`);
            const tickets = data?.items || data?.Items || [];
            const now = new Date();
            const activeTickets = tickets.filter(t => {
                const startTimeField = t.screeningStartTime || t.ScreeningStartTime;
                if (!startTimeField) return true;
                const screeningTime = new Date(startTimeField);
                return !isNaN(screeningTime.getTime()) && screeningTime >= now;
            });
            activeTickets.sort((a, b) => {
                const aTime = new Date(a.screeningStartTime || a.ScreeningStartTime || 0);
                const bTime = new Date(b.screeningStartTime || b.ScreeningStartTime || 0);
                return bTime - aTime;
            });
            setMyTickets(activeTickets);

            const uniqueDates = [...new Set(
                activeTickets
                    .map(t => { const s = t.screeningStartTime; return s ? s.substring(0, 10) : null; })
                    .filter(Boolean)
            )];
            if (uniqueDates.length > 0) {
                try {
                    const results = await Promise.all(
                        uniqueDates.map(date =>
                            apiGet(`${API_BASE_URL}/Screening?PageNumber=1&PageSize=100&Date=${encodeURIComponent(date)}`)
                                .then(r => r.data?.items || r.data?.Items || [])
                                .catch(() => [])
                        )
                    );
                    setAllScreenings(results.flat());
                } catch {/* */}
            }
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const fetchCurrentUser = async () => {
        setCurrentUser(null);
        try {
            const jwtPayload = decodeJwt(token);

            const jwtId =
                jwtPayload?.loggedUserId ||
                jwtPayload?.LoggedUserId ||
                jwtPayload?.nameid ||
                jwtPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                jwtPayload?.sub ||
                jwtPayload?.id ||
                '';

            if (!jwtId) {
                setCurrentUser(false);
                return;
            }

            const applyUser = (user) => {
                setCurrentUser(user);
                setProfileForm({
                    fName: user.fName || user.FName || '',
                    lName: user.lName || user.LName || '',
                    birthday: extractUTCDateFromISO(user.birthday || user.Birthday || ''),
                    username: user.username || user.Username || '',
                    passwordHash: user.passwordHash || user.PasswordHash || '',
                });
            };

            const { data } = await apiGet(`${API_BASE_URL}/User/${jwtId}`);
            if (data && (data.id || data.Id || data.username || data.Username)) {
                applyUser(data);
                return;
            }

            setCurrentUser(false);
        } catch (err) {
            setServerError(getProblemDetailsMessage(err));
            setCurrentUser(false);
        }
    };

    const handleProfileUpdate = async () => {
        setServerError(''); setSuccess(''); setProfileErrors({});
        const errors = {};
        if (!(profileForm.fName || '').trim()) errors.fName = 'First name is required.';
        if (!(profileForm.lName || '').trim()) errors.lName = 'Last name is required.';
        if (!(profileForm.username || '').trim()) errors.username = 'Username is required.';
        else if (profileForm.username.trim().length < 3) errors.username = 'Username must be at least 3 characters.';
        if (!(profileForm.passwordHash || '').trim()) errors.passwordHash = 'Password is required.';
        else if (profileForm.passwordHash.trim().length < 6) errors.passwordHash = 'Password must be at least 6 characters.';
        if (Object.keys(errors).length > 0) { setProfileErrors(errors); return; }
        const userId = currentUser?.id || currentUser?.Id;

        const inputPassword = (profileForm.passwordHash || '').trim();

        const payload = {
            fName: profileForm.fName.trim(),
            lName: profileForm.lName.trim(),
            username: profileForm.username.trim(),
            passwordHash: inputPassword !== '' ? inputPassword : null,
            birthday: dateStringToUTCISO(profileForm.birthday),
            isAdmin: !!(currentUser?.isAdmin || currentUser?.IsAdmin),
        };
        try {
            await apiPut(`${API_BASE_URL}/User/${userId}`, payload);
            setSuccess('Profile updated successfully!');
            setProfileEditing(false);
            await fetchCurrentUser();
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const buyTicket = async () => {
        if (!selectedSeat || !activeScreening) return;
        setServerError(''); setSuccess('');
        const scrId = activeScreening.id || activeScreening.Id;
        const seatToBuy = Number(selectedSeat);
        try {
            await apiPost(`${API_BASE_URL}/Ticket`, { screeningId: scrId, seatNum: seatToBuy, purchasedAt: new Date().toISOString() });
            setSuccess(`Successfully purchased ticket for Seat №${seatToBuy}!`);
            setSelectedSeat(null);
            await fetchMyTickets();
            fetchTakenSeatsForScreening(activeScreening);
        } catch (err) {
            setServerError(getProblemDetailsMessage(err));
            setSelectedSeat(null);
        }
    };

    const deleteTicket = async (ticketId) => {
        if (!window.confirm('Do you want to cancel this ticket?')) return;
        setServerError(''); setSuccess('');
        try {
            await apiDelete(`${API_BASE_URL}/Ticket/${ticketId}`);
            setSuccess('Ticket cancelled!');
            fetchMyTickets();
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const getTicketHallLabel = (ticket) => {
        const tMovie = (ticket.movieTitle || '').trim().toLowerCase();
        const tStart = (ticket.screeningStartTime || '').substring(0, 16);
        const scr = allScreenings.find(s => {
            const sMovie = (s.movieTitle || s.MovieTitle || '').trim().toLowerCase();
            const sStart = (s.startTime || s.StartTime || '').substring(0, 16);
            return sMovie === tMovie && sStart === tStart;
        });
        if (scr) {
            const hallId = scr.hallId || scr.HallId;
            const hall = halls.find(h => String(h.id ?? h.Id) === String(hallId));
            if (hall) return `Hall № ${hall.hallNum ?? hall.HallNum ?? ''}`;
        }
        return '—';
    };

    const exportTicketAsPDF = (ticket) => {
        const ticketId = String(ticket.id || ticket.Id || '').substring(0, 8).toUpperCase();
        const movie = ticket.movieTitle || ticket.MovieTitle || 'N/A';
        const seat = ticket.seatNum || ticket.SeatNum || 'N/A';
        const hall = getTicketHallLabel(ticket);
        const dateStr = displayUTCDate(ticket.screeningStartTime || ticket.ScreeningStartTime || ticket.startTime || ticket.StartTime, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
        const price = ticket.price || ticket.Price || ticket.screeningPrice || ticket.ScreeningPrice || '';

        const printWindow = window.open('', '_blank', 'width=480,height=640');
        printWindow.document.write(`<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8" />
            <title>Ticket #${ticketId}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: 'Space Grotesk', sans-serif; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
              .ticket { width: 400px; border: 2px solid #0f1115; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
              .ticket-header { background: #0f1115; color: #deff9a; padding: 24px 28px 20px; }
              .ticket-header .cinema { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; margin-bottom: 6px; }
              .ticket-header .movie { font-size: 22px; font-weight: 700; line-height: 1.2; }
              .divider { display: flex; align-items: center; gap: 0; }
              .divider .notch { width: 24px; height: 24px; background: #fff; border-radius: 50%; flex-shrink: 0; }
              .divider .notch.left { margin-left: -12px; }
              .divider .notch.right { margin-left: auto; margin-right: -12px; }
              .divider .line { flex: 1; border-top: 2px dashed #ddd; }
              .ticket-body { background: #fff; padding: 24px 28px; color: #0f1115; }
              .row { display: flex; justify-content: space-between; margin-bottom: 16px; }
              .field label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 4px; display: block; }
              .field span { font-size: 15px; font-weight: 600; color: #0f1115; }
              .ticket-id { margin-top: 4px; font-size: 11px; letter-spacing: 2px; color: #aaa; }
              .barcode { margin-top: 20px; text-align: center; }
              .barcode svg { display: block; margin: 0 auto 4px; }
              .barcode small { font-size: 11px; color: #aaa; letter-spacing: 2px; }
              .badge { display: inline-block; background: #deff9a; color: #0f1115; border-radius: 6px; padding: 2px 10px; font-size: 12px; font-weight: 700; margin-top: 4px; }
              @media print {
                body { background: #fff; min-height: unset; padding: 0; }
                .ticket { box-shadow: none; border-color: #ccc; }
                .no-print { display: none !important; }
              }
            </style>
            </head>
            <body>
            <div class="ticket">
              <div class="ticket-header">
                <div class="cinema">🎬 Movie Theatre</div>
                <div class="movie">${movie}</div>
                <div class="ticket-id">Ticket #${ticketId}</div>
              </div>
              <div class="divider">
                <div class="notch left"></div>
                <div class="line"></div>
                <div class="notch right"></div>
              </div>
              <div class="ticket-body">
                <div class="row">
                  <div class="field">
                    <label>Date &amp; Time (UTC)</label>
                    <span>${dateStr || 'N/A'}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label>Seat</label>
                    <span><span class="badge">№ ${seat}</span></span>
                  </div>
                  <div class="field" style="text-align:right">
                    <label>Hall</label>
                    <span>${hall}</span>
                  </div>
                </div>
                ${price ? `<div class="row"><div class="field"><label>Price</label><span>€${price}</span></div></div>` : ''}
                <div class="barcode">
                  <svg width="180" height="40" viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
                    ${Array.from({ length: 36 }, (_, i) => {
                        const x = 4 + i * 4.8;
                        const h = 20 + (Math.sin(i * 1.7 + ticketId.charCodeAt(i % ticketId.length || 1)) * 10);
                        const w = i % 3 === 0 ? 2.5 : i % 5 === 0 ? 1.2 : 2;
                        return `<rect x="${x.toFixed(1)}" y="${((40 - h) / 2).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" fill="#0f1115"/>`;
                    }).join('')}
                  </svg>
                  <small>${ticketId}</small>
                </div>
              </div>
            </div>
            <script>window.onload = () => { window.print(); };</script>
            </body>
            </html>`);
        printWindow.document.close();
    };

    const handleMovieSubmit = async (e) => {
        e.preventDefault(); setServerError(''); setSuccess(''); setFieldErrors({});
        const errors = isValidMovieForm(movieForm);
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        const payload = { title: movieForm.title.trim(), genre: movieForm.genre.trim(), releaseDate: dateStringToUTCISO(movieForm.releaseDate), durationMinutes: Number(movieForm.durationMinutes), description: movieForm.description.trim(), rating: Number(movieForm.rating) };
        try {
            if (editingMovieId) await apiPut(`${API_BASE_URL}/Movie/${editingMovieId}`, payload);
            else await apiPost(`${API_BASE_URL}/Movie`, payload);
            setSuccess(editingMovieId ? 'Movie updated!' : 'New movie added!');
            setMovieForm({ title: '', genre: '', releaseDate: '', durationMinutes: '', description: '', rating: '0' });
            setEditingMovieId(null);
            await Promise.all([fetchMoviesAdmin(), fetchMoviesForProgram()]);
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const startMovieEdit = (movie) => {
        const id = movie.id || movie.Id; setEditingMovieId(id);
        const rDate = movie.releaseDate || movie.ReleaseDate;
        setMovieForm({ title: movie.title || movie.Title || '', genre: movie.genre || movie.Genre || '', releaseDate: extractUTCDateFromISO(rDate), durationMinutes: String(movie.durationMinutes ?? movie.DurationMinutes ?? ''), description: movie.description || movie.Description || '', rating: String(movie.rating ?? movie.Rating ?? 0) });
        setFieldErrors({});
    };

    const handleHallSubmit = async (e) => {
        e.preventDefault(); setServerError(''); setSuccess(''); setFieldErrors({});
        const errors = isValidHallForm(hallForm);
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        const soundIndex = SOUND_SYSTEMS.findIndex(s => s.value === hallForm.soundSystem);
        const payload = { hallNum: Number(hallForm.hallNum), seatsCount: Number(hallForm.seatsCount), is3D: !!hallForm.is3D, soundSystem: soundIndex >= 0 ? soundIndex : 0, isPremium: !!hallForm.isPremium };
        try {
            if (editingHallId) await apiPut(`${API_BASE_URL}/Hall/${editingHallId}`, payload);
            else await apiPost(`${API_BASE_URL}/Hall`, payload);
            setSuccess(editingHallId ? 'Hall updated!' : 'New hall added!');
            setHallForm({ hallNum: '', seatsCount: '', is3D: false, soundSystem: 'Standard', isPremium: false });
            setEditingHallId(null);
            const [updatedHalls] = await Promise.all([fetchHallsForSelect(), fetchHallsPage()]);
            setHalls(updatedHalls);
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const startHallEdit = (hall) => {
        setEditingHallId(hall.id || hall.Id);
        setHallForm({ hallNum: String(hall.hallNum ?? hall.HallNum ?? ''), seatsCount: String(hall.seatsCount ?? hall.SeatsCount ?? ''), is3D: !!(hall.is3D ?? hall.Is3D), soundSystem: hall.soundSystem ?? hall.SoundSystem ?? "Standard", isPremium: !!(hall.isPremium ?? hall.IsPremium) });
        setFieldErrors({});
    };

    const handleScreeningSubmit = async (e) => {
        e.preventDefault(); setServerError(''); setSuccess(''); setFieldErrors({});
        const errors = isValidScreeningForm(screeningForm);
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        const startDate = datetimeLocalToUTC(screeningForm.startTime);
        const endDate = datetimeLocalToUTC(screeningForm.endTime);
        const payload = { movieId: screeningForm.movieId, hallId: screeningForm.hallId, startTime: startDate.toISOString(), endTime: endDate.toISOString(), type: Number.isFinite(parseInt(screeningForm.type, 10)) ? parseInt(screeningForm.type, 10) : 0, price: Number(screeningForm.price) };
        try {
            if (editingScreeningId) await apiPut(`${API_BASE_URL}/Screening/${editingScreeningId}`, payload);
            else await apiPost(`${API_BASE_URL}/Screening`, payload);
            setSuccess('Screening successfully saved!');
            setScreeningForm({ movieId: '', hallId: '', startTime: '', endTime: '', price: '', type: '0' });
            setEditingScreeningId(null); fetchAdminScreenings();
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const startScreeningEdit = (scr) => {
        const id = scr.id || scr.Id;
        setEditingScreeningId(id);
        setScreeningForm({ movieId: scr.movieId || scr.MovieId, hallId: scr.hallId || scr.HallId, startTime: scr.startTime ? scr.startTime.substring(0, 16) : "", endTime: scr.endTime ? scr.endTime.substring(0, 16) : "", type: scr.type || "", price: scr.price || 0 });
        setFieldErrors({});
    };

    const handleAdminUserSubmit = async (e) => {
        e.preventDefault(); setServerError(''); setSuccess(''); setFieldErrors({});
        const errors = isValidUserForm(newUserAdminForm);
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        const payload = {
            fName: newUserAdminForm.fName,
            lName: newUserAdminForm.lName,
            username: newUserAdminForm.username,
            passwordHash: newUserAdminForm.passwordHash,
            birthday: dateStringToUTCISO(newUserAdminForm.birthday),
            isAdmin: !!newUserAdminForm.isAdmin
        };
        try {
            await apiPost(`${API_BASE_URL}/User`, payload);
            setSuccess('User created successfully!');
            setNewUserAdminForm({ username: '', passwordHash: '', fName: '', lName: '', birthday: '', isAdmin: false });
            fetchAdminUsers();
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Delete user?')) return;
        try { await apiDelete(`${API_BASE_URL}/User/${id}`); setSuccess('User deleted.'); fetchAdminUsers(); } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    const startUserEdit = async (user) => {
        const userId = user.id || user.Id;
        setEditingUserId(userId);
        setServerError(''); setSuccess('');
        try {
            const { data } = await apiGet(`${API_BASE_URL}/User/${userId}`);
            const originalPassword = data.passwordHash || data.PasswordHash || '';
            setOriginalUserPasswordHash(originalPassword);
            setNewUserAdminForm({
                username: data.username || data.Username || '',
                passwordHash: '',
                fName: data.fName || data.FName || '',
                lName: data.lName || data.LName || '',
                birthday: data.birthday || data.Birthday ? (data.birthday || data.Birthday).slice(0, 10) : '',
                isAdmin: data.isAdmin || data.IsAdmin || false
            });
            setFieldErrors({});
        } catch (err) {
            setServerError(getProblemDetailsMessage(err));
            setEditingUserId(null);
        }
    };

    const handleAdminUserUpdate = async (userId) => {
        setServerError(''); setSuccess(''); setFieldErrors({});
        if (!newUserAdminForm.fName.trim()) { setFieldErrors({ fname: 'First name is required.' }); return; }
        if (!newUserAdminForm.lName.trim()) { setFieldErrors({ lname: 'Last name is required.' }); return; }

        const passwordToSend = newUserAdminForm.passwordHash.trim() || originalUserPasswordHash;

        const payload = {
            fName: newUserAdminForm.fName,
            lName: newUserAdminForm.lName,
            username: newUserAdminForm.username,
            passwordHash: passwordToSend,
            birthday: dateStringToUTCISO(newUserAdminForm.birthday),
            isAdmin: !!newUserAdminForm.isAdmin
        };
        try {
            await apiPut(`${API_BASE_URL}/User/${userId}`, payload);
            setSuccess('User updated successfully!');
            setEditingUserId(null);
            setNewUserAdminForm({ username: '', passwordHash: '', fName: '', lName: '', birthday: '', isAdmin: false });
            setOriginalUserPasswordHash('');
            fetchAdminUsers();
        } catch (err) { setServerError(getProblemDetailsMessage(err)); }
    };

    useEffect(() => {
        if (!token || !isAdmin) return;
        if (adminSubTab === 'movies') fetchMoviesAdmin();
        if (adminSubTab === 'halls') fetchHallsPage();
        if (adminSubTab === 'screenings') fetchAdminScreenings();
        if (adminSubTab === 'users') fetchAdminUsers();
    }, [token, isAdmin, moviePageNumber, hallPageNumber, adminScreeningPageNumber, adminMovieTitleQuery, movieSortBy, movieIsAscending, adminHallNumQuery, hallSortBy, hallIsAscending, adminScreeningQuery, adminScreeningSortBy, adminScreeningIsAscending, adminUserSearchQuery, adminUserSortBy, adminUserIsAscending]);

    useEffect(() => {
        if (!token) return;
        if (activeTab === 'movies') {
            fetchMoviesForProgram();
            fetchScreeningsProgram();
            (async () => { const allHalls = await fetchHallsForSelect(); setHalls(allHalls); })();
        }
        if (activeTab === 'tickets') {
            fetchMyTickets();
        }
        if (activeTab === 'profile') {
            fetchCurrentUser();
        }
        if (activeTab === 'admin' && isAdmin) {
            if (adminSubTab === 'movies') fetchMoviesAdmin();
            if (adminSubTab === 'halls') fetchHallsPage();
            if (adminSubTab === 'screenings') fetchAdminScreenings();
            if (adminSubTab === 'users') fetchAdminUsers();
        }
    }, [activeTab]);

    useEffect(() => {
        if (!token || !isAdmin || activeTab !== 'admin') return;
        if (adminSubTab === 'movies') fetchMoviesAdmin();
        if (adminSubTab === 'halls') fetchHallsPage();
        if (adminSubTab === 'screenings') fetchAdminScreenings();
        if (adminSubTab === 'users') fetchAdminUsers();
    }, [adminSubTab]);

    const getTakenSeats = () => {
        if (!activeScreening) return [];
        const scrId = activeScreening.id || activeScreening.Id;
        const allTaken = dynamicTakenSeats[scrId] || [];
        const mySeatsForThisScreening = myTickets
            .filter(t => String(t.screeningId || t.ScreeningId) === String(scrId))
            .map(t => Number(t.seatNum || t.SeatNum));
        return allTaken.filter(seat => !mySeatsForThisScreening.includes(seat));
    };
    const getSeatsArray = () => {
        if (!activeScreening) return Array.from({ length: 40 }, (_, i) => i + 1);
        const hallId = activeScreening.hallId || activeScreening.HallId;
        const found = halls.find((h) => String(h.id ?? h.Id) === String(hallId));
        const totalSeats = found ? Number(found.seatsCount ?? found.SeatsCount ?? 40) : 40;
        return Array.from({ length: Math.max(1, Math.min(1000, totalSeats)) }, (_, i) => i + 1);
    };

    const getHallNumberLabel = (hallId) => {
        const found = halls.find((h) => String(h.id ?? h.Id) === String(hallId));
        return found ? `Hall № ${found.hallNum ?? found.HallNum ?? ''}` : 'Hall';
    };

    const tabStyle = (active) => ({ padding: '8px 16px', backgroundColor: active ? '#232834' : 'transparent', color: active ? '#deff9a' : '#a0aec0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' });
    const dayButtonStyle = (active) => ({ padding: '10px 15px', backgroundColor: active ? '#deff9a' : '#161920', color: active ? '#0f1115' : '#a0aec0', border: active ? '1px solid #deff9a' : '1px solid #232834', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' });
    const inputStyle = { width: '100%', padding: '10px', backgroundColor: '#0f1115', border: '1px solid #232834', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' };

    if (!token) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f1115', color: '#fff', padding: '20px' }}>
                <div style={{ backgroundColor: '#161920', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid #232834' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#deff9a' }}>{isLoginView ? 'Login' : 'Register'}</h2>
                    <AlertBlock type="error" message={serverError} onDismiss={() => setServerError('')} />
                    <AlertBlock type="success" message={success} onDismiss={() => setSuccess('')} />
                    <form onSubmit={isLoginView ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {!isLoginView && (
                            <>
                                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} required />
                                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} required />
                                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} style={inputStyle} required />
                            </>
                        )}
                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
                        <button type="submit" style={{ padding: '12px', background: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}>
                            {isLoginView ? 'Login' : 'Register'}
                        </button>
                    </form>
                    <p onClick={() => { setIsLoginView(!isLoginView); setServerError(''); setSuccess(''); }} style={{ textAlign: 'center', marginTop: '20px', color: '#a0aec0', cursor: 'pointer', fontSize: '14px' }}>
                        {isLoginView ? (<>Don&apos;t have an account?{' '}
                            <span style={{ textDecoration: 'underline', color: '#deff9a', fontWeight: 'bold', }}>
                                Register here
                            </span>
                        </>
                        ) : (
                            <>Already have an account?{' '}
                                <span style={{ textDecoration: 'underline', color: '#deff9a', fontWeight: 'bold', }}>
                                    Login here
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#0f1115', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '1px solid #232834', backgroundColor: '#161920', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#deff9a', fontWeight: '800' }}>🎬 MOVIE THEATRE</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => setActiveTab('movies')} style={tabStyle(activeTab === 'movies')}>Program</button>
                    <button onClick={() => setActiveTab('tickets')} style={tabStyle(activeTab === 'tickets')}>My Tickets</button>
                    <button onClick={() => setActiveTab('profile')} style={tabStyle(activeTab === 'profile')}>👤 Profile</button>
                    {isAdmin && <button onClick={() => setActiveTab('admin')} style={tabStyle(activeTab === 'admin')}>Admin Panel</button>}
                    <button onClick={handleLogout} style={{ marginLeft: '15px', padding: '8px 14px', background: '#ff4d4d22', border: '1px solid #ff4d4d', color: '#ff9999', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Logout</button>
                </div>
            </div>

            <div style={{ padding: '20px 24px 0 24px' }}>
                <AlertBlock type="error" message={serverError} onDismiss={() => setServerError('')} />
                <AlertBlock type="success" message={success} onDismiss={() => setSuccess('')} />
            </div>

            <div style={{ padding: '20px 24px', width: '100%', height: '100%', boxSizing: 'border-box' }}>
                {activeTab === 'movies' && !activeScreening && (
                    <div>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#161920', padding: '15px', borderRadius: '12px' }}>
                            <input type="text" placeholder="Search Title..." value={screeningTitleQuery} onChange={e => setScreeningTitleQuery(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
                            <input type="text" placeholder="Search Genre..." value={screeningGenreQuery} onChange={e => setScreeningGenreQuery(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
                            <select value={screeningSortBy} onChange={e => setScreeningSortBy(e.target.value)} style={{ ...inputStyle, width: '150px' }}>
                                <option value="StartTime">Start Time</option>
                                <option value="Price">Price</option>
                            </select>
                            <button onClick={() => setScreeningIsAscending(!screeningIsAscending)} style={{ padding: '10px', background: '#232834', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                {screeningIsAscending ? '⬆ Asc' : '⬇ Desc'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '30px' }}>
                            {weekDays.map((d) => (
                                <button key={d.isoString} onClick={() => setSelectedDay(d.isoString)} style={dayButtonStyle(selectedDay === d.isoString)}>{d.label}</button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                            {screenings.length === 0 ? (
                                <p style={{ color: '#a0aec0', gridColumn: '1/-1', textAlign: 'center' }}>No screenings scheduled for this day.</p>
                            ) : (
                                screenings.map((scr) => {
                                    const sId = scr.id || scr.Id;
                                    const timeStr = displayUTCDate(scr.startTime || scr.StartTime, { hour: '2-digit', minute: '2-digit' });
                                    const movie = movies.find(m => String(m.id ?? m.Id) === String(scr.movieId || scr.MovieId));
                                    const genre = scr.movieGenre || scr.MovieGenre || movie?.genre || movie?.Genre || '';
                                    const duration = scr.movieDuration || scr.MovieDuration || scr.durationMinutes || scr.DurationMinutes || movie?.durationMinutes || movie?.DurationMinutes || '';
                                    return (
                                        <div key={sId} style={{ backgroundColor: '#161920', border: '1px solid #232834', borderRadius: '14px', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff' }}>{scr.movieTitle || scr.MovieTitle}</h3>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                    {genre && <span style={{ padding: '2px 10px', backgroundColor: '#deff9a22', border: '1px solid #deff9a55', color: '#deff9a', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{genre}</span>}
                                                    {duration && <span style={{ padding: '2px 10px', backgroundColor: '#2ec4b622', border: '1px solid #2ec4b655', color: '#2ec4b6', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>⏱ {duration} min</span>}
                                                </div>
                                                <p style={{ color: '#deff9a', fontSize: '14px', margin: '0 0 6px 0', fontWeight: '600' }}>🕒 {timeStr} UTC</p>
                                                <p style={{ color: '#a0aec0', fontSize: '13px', margin: '0 0 4px 0' }}>📍 {getHallNumberLabel(scr.hallId || scr.HallId)}</p>
                                                <p style={{ color: '#a0aec0', fontSize: '13px', margin: '0' }}>📽️ {scr.type || '2D'}</p>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                <span style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>€{scr.price ?? scr.Price ?? 0}</span>
                                                <button onClick={() => { setActiveScreening(scr); setSelectedSeat(null); }} style={{ padding: '10px 20px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Select Seat</button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <PaginationBar page={screeningPageNumber} totalPages={screeningsPageMeta.totalPages} pageSize={screeningPageSize} onPageChange={setScreeningPageNumber} />
                    </div>
                )}

                {activeTab === 'movies' && activeScreening && (
                    <div style={{ backgroundColor: '#161920', border: '1px solid #232834', borderRadius: '16px', padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <div>
                            {(() => {
                                const movie = movies.find(m => String(m.id ?? m.Id) === String(activeScreening.movieId || activeScreening.MovieId));
                                const genre = activeScreening.movieGenre || activeScreening.MovieGenre || movie?.genre || movie?.Genre || '';
                                const duration = activeScreening.movieDuration || activeScreening.MovieDuration || activeScreening.durationMinutes || activeScreening.DurationMinutes || movie?.durationMinutes || movie?.DurationMinutes || '';
                                const description = activeScreening.movieDescription || activeScreening.MovieDescription || movie?.description || movie?.Description || '';
                                return (<>
                                    <button onClick={() => setActiveScreening(null)} style={{ background: 'none', border: 'none', color: '#deff9a', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', marginBottom: '20px' }}>← Back</button>
                                    <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '28px' }}>{activeScreening.movieTitle || activeScreening.MovieTitle}</h2>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        {genre && <span style={{ padding: '3px 12px', backgroundColor: '#deff9a22', border: '1px solid #deff9a55', color: '#deff9a', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{genre}</span>}
                                        {duration && <span style={{ padding: '3px 12px', backgroundColor: '#2ec4b622', border: '1px solid #2ec4b655', color: '#2ec4b6', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>⏱ {duration} min</span>}
                                    </div>
                                    {description && (
                                        <div style={{ backgroundColor: '#0f1115', padding: '18px 20px', borderRadius: '12px', border: '1px solid #232834', marginBottom: '16px' }}>
                                            <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>About the Film</h4>
                                            <p style={{ color: '#a0aec0', margin: 0, lineHeight: '1.6', fontSize: '14px' }}>{description}</p>
                                        </div>
                                    )}
                                    <div style={{ backgroundColor: '#0f1115', padding: '18px 20px', borderRadius: '12px', border: '1px solid #232834' }}>
                                        <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Screening Info</h4>
                                        <p style={{ color: '#a0aec0', margin: '6px 0' }}>🕒 <strong style={{ color: '#fff' }}>Start (UTC):</strong> {displayUTCDate(activeScreening.startTime, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        <p style={{ color: '#a0aec0', margin: '6px 0' }}>📍 <strong style={{ color: '#fff' }}>Hall:</strong> {getHallNumberLabel(activeScreening.hallId || activeScreening.HallId)}</p>
                                        <p style={{ color: '#a0aec0', margin: '6px 0' }}>📽️ <strong style={{ color: '#fff' }}>Type:</strong> {activeScreening.type}</p>
                                        <p style={{ color: '#a0aec0', margin: '6px 0' }}>💰 <strong style={{ color: '#fff' }}>Price:</strong> <span style={{ color: '#deff9a', fontWeight: '700' }}>€{activeScreening.price}</span></p>
                                    </div>
                                </>);
                            })()}
                        </div>

                        <div>
                            <div style={{ width: '100%', height: '8px', background: '#232834', borderRadius: '4px', textAlign: 'center', color: '#a0aec0', fontSize: '12px', lineHeight: '35px', textTransform: 'uppercase', marginBottom: '50px', boxShadow: '0px 4px 20px rgba(222,255,154,0.1)' }}>SCREEN</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
                                {getSeatsArray().map((seatNum) => {
                                    const isTaken = getTakenSeats().includes(seatNum);
                                    const isSelected = selectedSeat === seatNum;
                                    return (
                                        <button
                                            key={seatNum} disabled={isTaken} onClick={() => setSelectedSeat(isSelected ? null : seatNum)}
                                            style={{ padding: '12px 0', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: isTaken ? 'not-allowed' : 'pointer', backgroundColor: isTaken ? '#232834' : isSelected ? '#deff9a' : '#0f1115', color: isTaken ? '#4a5568' : isSelected ? '#0f1115' : '#fff', transition: 'all 0.2s' }}
                                        >
                                            {seatNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button disabled={!selectedSeat} onClick={buyTicket} style={{ width: '100%', padding: '14px', backgroundColor: selectedSeat ? '#deff9a' : '#232834', color: selectedSeat ? '#0f1115' : '#4a5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: selectedSeat ? 'pointer' : 'not-allowed' }}>
                                Buy Seat №{selectedSeat || '?'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'tickets' && (() => {
                    const q = ticketSearch.toLowerCase();
                    const filtered = myTickets
                        .filter((t) => {
                            if (!q) return true;
                            const title = (t.movieTitle || t.MovieTitle || '').toLowerCase();
                            const hall = getTicketHallLabel(t).toLowerCase();
                            return title.includes(q) || hall.includes(q);
                        })
                        .sort((a, b) => {
                            let av, bv;
                            if (ticketSortBy === 'date') {
                                av = new Date(a.screeningStartTime || a.ScreeningStartTime || 0).getTime();
                                bv = new Date(b.screeningStartTime || b.ScreeningStartTime || 0).getTime();
                            } else if (ticketSortBy === 'movie') {
                                av = (a.movieTitle || a.MovieTitle || '').toLowerCase();
                                bv = (b.movieTitle || b.MovieTitle || '').toLowerCase();
                            } else if (ticketSortBy === 'seat') {
                                av = Number(a.seatNum || a.SeatNum || 0);
                                bv = Number(b.seatNum || b.SeatNum || 0);
                            }
                            if (av < bv) return ticketSortAsc ? -1 : 1;
                            if (av > bv) return ticketSortAsc ? 1 : -1;
                            return 0;
                        });
                    return (
                        <div>
                            <h3 style={{ fontSize: '26px', marginBottom: '16px' }}>Purchased Tickets</h3>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', backgroundColor: '#161920', padding: '14px 16px', borderRadius: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by movie or hall…"
                                    value={ticketSearch}
                                    onChange={(e) => setTicketSearch(e.target.value)}
                                    style={{ ...inputStyle, width: '220px' }}
                                />
                                <select value={ticketSortBy} onChange={(e) => setTicketSortBy(e.target.value)} style={{ ...inputStyle, width: '140px' }}>
                                    <option value="date">Sort by Date</option>
                                    <option value="movie">Sort by Movie</option>
                                    <option value="seat">Sort by Seat</option>
                                </select>
                                <button
                                    onClick={() => setTicketSortAsc(!ticketSortAsc)}
                                    style={{ padding: '10px 14px', background: '#232834', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    {ticketSortAsc ? '⬆ Asc' : '⬇ Desc'}
                                </button>
                                <span style={{ color: '#a0aec0', fontSize: '13px', marginLeft: 'auto' }}>
                                    {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {filtered.length === 0 ? (
                                <p style={{ color: '#a0aec0' }}>{myTickets.length === 0 ? 'You do not have any tickets.' : 'No tickets match your search.'}</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                    {filtered.map((t) => (
                                        <div key={t.id || t.Id} style={{ backgroundColor: '#161920', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #deff9a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#a0aec0', fontWeight: '400' }}>Ticket #{String(t.id || t.Id)?.substring(0, 8).toUpperCase()}</h4>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{t.movieTitle || t.MovieTitle}</p>
                                                <p style={{ color: '#a0aec0', margin: '4px 0', fontSize: '14px' }}>🕒 {displayUTCDate(t.screeningStartTime || t.ScreeningStartTime || t.startTime || t.StartTime, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC</p>
                                                <p style={{ color: '#a0aec0', margin: '4px 0', fontSize: '14px' }}>📍 {getTicketHallLabel(t)}</p>
                                                <p style={{ color: '#deff9a', margin: '4px 0', fontSize: '14px', fontWeight: '600' }}>Seat №: {t.seatNum || t.SeatNum}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button onClick={() => exportTicketAsPDF(t)} style={{ padding: '6px 12px', background: '#deff9a22', border: '1px solid #deff9a', color: '#deff9a', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>📄 Export PDF</button>
                                                <button onClick={() => deleteTicket(t.id || t.Id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #ff4d4d', color: '#ff9999', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel Ticket</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {activeTab === 'profile' && (
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        <style>{`
                            @keyframes profileFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                            .profile-card { animation: profileFadeIn 0.3s ease; }
                            .profile-info-row:hover { background: #1a1f2b !important; }
                            .profile-save-btn:hover { opacity: 0.9; transform: translateY(-1px); }
                            .profile-save-btn { transition: all 0.15s ease; }
                        `}</style>

                        {/* Loading state */}
                        {currentUser === null && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #232834', borderTop: '3px solid #deff9a', animation: 'spin 0.8s linear infinite' }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                <p style={{ color: '#a0aec0', margin: 0 }}>Loading profile…</p>
                            </div>
                        )}

                        {/* Not-found state */}
                        {currentUser === false && (
                            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>😕</div>
                                <p style={{ color: '#a0aec0', margin: '0 0 16px' }}>Could not load your profile. Please try logging out and back in.</p>
                            </div>
                        )}

                        {/* ── VIEW MODE ── */}
                        {currentUser && currentUser !== false && !profileEditing && (
                            <div className="profile-card">
                                {/* Hero / avatar banner */}
                                <div style={{ backgroundColor: '#161920', borderRadius: '16px', border: '1px solid #232834', overflow: 'hidden', marginBottom: '20px' }}>
                                    {/* Banner strip */}
                                    <div style={{ height: '80px', background: 'linear-gradient(135deg, #1a2a1a 0%, #232834 50%, #1a2035 100%)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', bottom: '-36px', left: '28px', width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #deff9a 0%, #b8e65a 100%)', border: '3px solid #161920', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', color: '#0f1115', flexShrink: 0, boxShadow: '0 4px 16px rgba(222,255,154,0.3)' }}>
                                            {((currentUser.fName || currentUser.FName || '?')[0] + (currentUser.lName || currentUser.LName || '')[0]).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Name + role row */}
                                    <div style={{ padding: '48px 28px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
                                                {currentUser.fName || currentUser.FName} {currentUser.lName || currentUser.LName}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
                                                @{currentUser.username || currentUser.Username}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                                {(currentUser.isAdmin || currentUser.IsAdmin) && (
                                                    <span style={{ padding: '3px 12px', backgroundColor: '#deff9a22', border: '1px solid #deff9a', color: '#deff9a', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>⚡ Admin</span>
                                                )}
                                                <span style={{ padding: '3px 12px', backgroundColor: '#2ec4b622', border: '1px solid #2ec4b6', color: '#2ec4b6', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>🎬 Member</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setProfileEditing(true)}
                                            className="profile-save-btn"
                                            style={{ padding: '10px 20px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}
                                        >
                                            ✏️ Edit Profile
                                        </button>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Tickets Bought', value: myTickets.length, icon: '🎟️' },
                                        { label: 'Member Since', value: currentUser.createdOn || currentUser.CreatedOn ? displayUTCDate(currentUser.createdOn || currentUser.CreatedOn, { year: 'numeric', month: 'short', day: 'numeric' }) : '—', icon: '📅' },
                                        { label: 'Account Type', value: (currentUser.isAdmin || currentUser.IsAdmin) ? 'Admin' : 'Standard', icon: '🔑' },
                                    ].map(({ label, value, icon }) => (
                                        <div key={label} style={{ backgroundColor: '#161920', border: '1px solid #232834', borderRadius: '12px', padding: '16px 20px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{value}</div>
                                            <div style={{ fontSize: '12px', color: '#718096', marginTop: '3px' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Detail info card */}
                                <div style={{ backgroundColor: '#161920', borderRadius: '14px', border: '1px solid #232834', overflow: 'hidden' }}>
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #232834' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Details</span>
                                    </div>
                                    {[
                                        { label: 'First Name', value: currentUser.fName || currentUser.FName || '—', icon: '👤' },
                                        { label: 'Last Name', value: currentUser.lName || currentUser.LName || '—', icon: '👤' },
                                        { label: 'Username', value: `@${currentUser.username || currentUser.Username || '—'}`, icon: '🏷️' },
                                        { label: 'Birthday', value: displayUTCDate(currentUser.birthday || currentUser.Birthday, { year: 'numeric', month: 'long', day: 'numeric' }) || '—', icon: '🎂' },
                                        {
                                            label: 'Profile Last Updated',
                                            value: (currentUser.updatedOn || currentUser.UpdatedOn)
                                                ? displayUTCDate(currentUser.updatedOn || currentUser.UpdatedOn, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC'
                                                : 'Never updated',
                                            icon: '🕒',
                                            highlight: !!(currentUser.updatedOn || currentUser.UpdatedOn),
                                        },
                                    ].map(({ label, value, icon, highlight }, i, arr) => (
                                        <div
                                            key={label}
                                            className="profile-info-row"
                                            style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: i < arr.length - 1 ? '1px solid #0f1115' : 'none', transition: 'background 0.15s', gap: '12px' }}
                                        >
                                            <span style={{ fontSize: '16px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                                            <span style={{ color: '#718096', fontSize: '13px', minWidth: '160px', flexShrink: 0 }}>{label}</span>
                                            <span style={{ color: highlight ? '#deff9a' : '#fff', fontSize: '14px', fontWeight: highlight ? '600' : '400', marginLeft: 'auto', textAlign: 'right' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── EDIT MODE ── */}
                        {currentUser && currentUser !== false && profileEditing && (
                            <div className="profile-card" style={{ backgroundColor: '#161920', borderRadius: '16px', border: '1px solid #232834', overflow: 'hidden' }}>
                                {/* Edit header */}
                                <div style={{ padding: '20px 28px', borderBottom: '1px solid #232834', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #deff9a 0%, #b8e65a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#0f1115', flexShrink: 0 }}>
                                        {((currentUser.fName || currentUser.FName || '?')[0] + (currentUser.lName || currentUser.LName || '')[0]).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Edit Profile</div>
                                        <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>Changes will update your profile timestamp</div>
                                    </div>
                                </div>

                                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    {/* Username */}
                                    <div>
                                        <label style={{ display: 'block', color: '#a0aec0', marginBottom: '7px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Username <span style={{ color: '#ff4d4d' }}>*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={profileForm.username}
                                            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                            style={{ ...inputStyle, borderColor: profileErrors.username ? '#ff4d4d' : '#232834' }}
                                        />
                                        <InlineError message={profileErrors.username} />
                                    </div>

                                    {/* Name row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#a0aec0', marginBottom: '7px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>First Name <span style={{ color: '#ff4d4d' }}>*</span></label>
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                value={profileForm.fName}
                                                onChange={(e) => setProfileForm({ ...profileForm, fName: e.target.value })}
                                                style={{ ...inputStyle, borderColor: profileErrors.fName ? '#ff4d4d' : '#232834' }}
                                            />
                                            <InlineError message={profileErrors.fName} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#a0aec0', marginBottom: '7px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Last Name <span style={{ color: '#ff4d4d' }}>*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                value={profileForm.lName}
                                                onChange={(e) => setProfileForm({ ...profileForm, lName: e.target.value })}
                                                style={{ ...inputStyle, borderColor: profileErrors.lName ? '#ff4d4d' : '#232834' }}
                                            />
                                            <InlineError message={profileErrors.lName} />
                                        </div>
                                    </div>

                                    {/* Birthday */}
                                    <div>
                                        <label style={{ display: 'block', color: '#a0aec0', marginBottom: '7px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Birthday</label>
                                        <input
                                            type="date"
                                            value={profileForm.birthday}
                                            onChange={(e) => setProfileForm({ ...profileForm, birthday: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>

                                    {/* Password change */}
                                    < div >
                                        <label style={{ display: 'block', color: '#a0aec0', marginBottom: '7px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>New Password <span style={{ color: '#718096', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(leave blank to keep current)</span></label>
                                        <input
                                            type="password"
                                            placeholder="Leave blank to keep current password"
                                            value={profileForm.newPassword || ''}
                                            onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>

                                    {/* UpdatedOn preview note */}
                                    <div style={{ backgroundColor: '#0f1115', borderRadius: '8px', padding: '12px 16px', border: '1px solid #232834', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '14px' }}>🕒</span>
                                        <span style={{ color: '#718096', fontSize: '13px' }}>
                                            <strong style={{ color: '#a0aec0' }}>UpdatedOn</strong> will be set to the current UTC datetime when you save.
                                            {(currentUser.updatedOn || currentUser.UpdatedOn) && (
                                                <span> Last update: <span style={{ color: '#deff9a' }}>{displayUTCDate(currentUser.updatedOn || currentUser.UpdatedOn, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC</span></span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                                        <button
                                            onClick={handleProfileUpdate}
                                            className="profile-save-btn"
                                            style={{ flex: 1, padding: '12px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}
                                        >
                                            💾 Save Changes
                                        </button>
                                        <button
                                            onClick={() => {
                                                setProfileEditing(false);
                                                setProfileErrors({});
                                                if (currentUser) setProfileForm({
                                                    fName: currentUser.fName || currentUser.FName || '',
                                                    lName: currentUser.lName || currentUser.LName || '',
                                                    birthday: extractUTCDateFromISO(currentUser.birthday || currentUser.Birthday || ''),
                                                    username: currentUser.username || currentUser.Username || '',
                                                });
                                            }}
                                            style={{ padding: '12px 22px', backgroundColor: '#232834', color: '#a0aec0', border: '1px solid #2d3748', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'admin' && (
                    <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #232834', paddingBottom: '10px' }}>
                            <button onClick={() => setAdminSubTab('movies')} style={{ ...tabStyle(adminSubTab === 'movies'), color: adminSubTab === 'movies' ? '#fff' : '#718096' }}>Movies</button>
                            <button onClick={() => setAdminSubTab('halls')} style={{ ...tabStyle(adminSubTab === 'halls'), color: adminSubTab === 'halls' ? '#fff' : '#718096' }}>Halls</button>
                            <button onClick={() => setAdminSubTab('screenings')} style={{ ...tabStyle(adminSubTab === 'screenings'), color: adminSubTab === 'screenings' ? '#fff' : '#718096' }}>Screenings</button>
                            <button onClick={() => setAdminSubTab('users')} style={{ ...tabStyle(adminSubTab === 'users'), color: adminSubTab === 'users' ? '#fff' : '#718096' }}>Users & Admins</button>
                        </div>

                        {adminSubTab === 'movies' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                                <form onSubmit={handleMovieSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#161920', padding: '25px', borderRadius: '12px' }}>
                                    <h4 style={{ margin: 0, textAlign: 'center', fontSize: '18px', color: '#deff9a' }}>{editingMovieId ? 'Edit Movie' : 'Add Movie'}</h4>
                                    <label style={{ display: 'block', color: '#a0aec0' }}> Title: </label>
                                    <input type="text" placeholder="Title" value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.title} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Genre: </label>
                                    <input type="text" placeholder="Genre" value={movieForm.genre} onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.genre} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Release Date: </label>
                                    <input type="date" value={movieForm.releaseDate} onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.releaseDate} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Duration: </label>
                                    <input type="number" placeholder="Duration (min)" value={movieForm.durationMinutes} onChange={(e) => setMovieForm({ ...movieForm, durationMinutes: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.durationMinutes} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Description: </label>
                                    <textarea placeholder="Description" value={movieForm.description} onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })} style={{ ...inputStyle, height: '100px', resize: 'none' }} />
                                    <InlineError message={fieldErrors.description} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Rating: </label>
                                    <input type="number" step="0.1" max="5" placeholder="Rating (0-5)" value={movieForm.rating} onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.rating} />

                                    <button type="submit" style={{ padding: '10px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {editingMovieId ? 'Update Movie' : 'Add Movie'}
                                    </button>
                                    {editingMovieId && (
                                        <button type="button" onClick={() => { setEditingMovieId(null); setMovieForm({ title: '', genre: '', releaseDate: '', durationMinutes: '', description: '', rating: '0' }); setFieldErrors({}); }} style={{ padding: '10px', backgroundColor: '#232834', color: '#a0aec0', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                    )}
                                </form>

                                <div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input type="text" placeholder="Search Title..." value={adminMovieTitleQuery} onChange={e => setAdminMovieTitleQuery(e.target.value)} style={{ ...inputStyle, width: '250px' }} />
                                        <select value={movieSortBy} onChange={e => setMovieSortBy(e.target.value)} style={{ ...inputStyle, width: '180px' }}>
                                            <option value="ReleaseDate">Release Date</option>
                                            <option value="Rating">Rating</option>
                                        </select>
                                        <button onClick={() => setMovieIsAscending(!movieIsAscending)} style={{ padding: '10px', background: '#232834', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                            {movieIsAscending ? '⬆ Asc' : '⬇ Desc'}
                                        </button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#161920', borderRadius: '12px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #232834', color: '#a0aec0', textAlign: 'left' }}>
                                                <th style={{ padding: '15px' }}>Title</th>
                                                <th style={{ padding: '15px' }}>Genre</th>
                                                <th style={{ padding: '15px' }}>Rating</th>
                                                <th style={{ padding: '15px' }}>Release Date</th>
                                                <th style={{ padding: '15px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminMovies.map((m) => (
                                                <tr key={m.id || m.Id} style={{ borderBottom: '1px solid #0f1115' }}>
                                                    <td style={{ padding: '15px' }}>{m.title || m.Title}</td>
                                                    <td style={{ padding: '15px' }}>{m.genre || m.Genre}</td>
                                                    <td style={{ padding: '15px' }}>{m.rating ?? m.Rating ?? 'N/A'}</td>
                                                    <td style={{ padding: '15px' }}>{displayUTCDate(m.releaseDate || m.ReleaseDate, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <button onClick={() => startMovieEdit(m)} style={{ background: 'none', border: 'none', color: '#deff9a', marginRight: '10px', cursor: 'pointer' }}>Edit</button>
                                                        <button onClick={async () => { await apiDelete(`${API_BASE_URL}/Movie/${m.id || m.Id}`); await Promise.all([fetchMoviesAdmin(), fetchMoviesForProgram()]); }} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <PaginationBar page={moviePageNumber} totalPages={moviesPageMeta.totalPages} pageSize={moviePageSize} onPageChange={setMoviePageNumber} />
                                </div>
                            </div>
                        )}

                        {adminSubTab === 'halls' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                                <form onSubmit={handleHallSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#161920', padding: '25px', borderRadius: '12px' }}>
                                    <h4 style={{ margin: 0, textAlign: 'center', fontSize: '18px', color: '#deff9a' }}>{editingHallId ? 'Edit Hall' : 'Add Hall'}</h4>

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Hall Number: </label>
                                    <input type="number" placeholder="Hall Number" value={hallForm.hallNum} onChange={(e) => setHallForm({ ...hallForm, hallNum: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.hallNum} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Seats Count: </label>
                                    <input type="number" placeholder="Seats Count" value={hallForm.seatsCount} onChange={(e) => setHallForm({ ...hallForm, seatsCount: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.seatsCount} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Sound System: </label>
                                    <select value={hallForm.soundSystem} onChange={(e) => setHallForm({ ...hallForm, soundSystem: e.target.value })} style={inputStyle}>
                                        <option value="">Select Sound System</option>
                                        {SOUND_SYSTEMS.map((sys) => <option key={sys.value} value={sys.value}>{sys.label}</option>)}
                                    </select>
                                    <InlineError message={fieldErrors.soundSystem} />

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                                        <input type="checkbox" checked={hallForm.is3D} onChange={(e) => setHallForm({ ...hallForm, is3D: e.target.checked })} /> Supports 3D
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                                        <input type="checkbox" checked={hallForm.isPremium} onChange={(e) => setHallForm({ ...hallForm, isPremium: e.target.checked })} /> Premium Class
                                    </label>
                                    <button type="submit" style={{ padding: '10px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {editingHallId ? 'Update Hall' : 'Add Hall'}
                                    </button>
                                    {editingHallId && (
                                        <button type="button" onClick={() => { setEditingHallId(null); setHallForm({ hallNum: '', seatsCount: '', is3D: false, soundSystem: 'Standard', isPremium: false }); setFieldErrors({}); }} style={{ padding: '10px', backgroundColor: '#232834', color: '#a0aec0', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                    )}
                                </form>

                                <div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input type="text" placeholder="Search Hall Num..." value={adminHallNumQuery} onChange={e => setAdminHallNumQuery(e.target.value)} style={{ ...inputStyle, width: '250px' }} />
                                        <select value={hallSortBy} onChange={e => setHallSortBy(e.target.value)} style={{ ...inputStyle, width: '180px' }}>
                                            <option value="SeatsCount">Seats Count</option>
                                            <option value="HallNum">Hall Number</option>
                                        </select>
                                        <button onClick={() => setHallIsAscending(!hallIsAscending)} style={{ padding: '10px', background: '#232834', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                            {hallIsAscending ? '⬆ Asc' : '⬇ Desc'}
                                        </button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#161920', borderRadius: '12px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #232834', color: '#a0aec0', textAlign: 'left' }}>
                                                <th style={{ padding: '15px' }}>Hall №</th>
                                                <th style={{ padding: '15px' }}>Capacity</th>
                                                <th style={{ padding: '15px' }}>Class</th>
                                                <th style={{ padding: '15px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminHalls.map((h) => (
                                                <tr key={h.id || h.Id} style={{ borderBottom: '1px solid #0f1115' }}>
                                                    <td style={{ padding: '15px', color: '#fff' }}>Hall {h.hallNum ?? h.HallNum}</td>
                                                    <td style={{ padding: '15px', color: '#fff' }}>{h.seatsCount ?? h.SeatsCount} seats</td>
                                                    <td style={{ padding: '15px', color: '#fff' }}>{(h.isPremium ?? h.IsPremium) ? 'Premium' : 'Standard'}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <button onClick={() => startHallEdit(h)} style={{ background: 'none', border: 'none', color: '#deff9a', marginRight: '10px', cursor: 'pointer' }}>Edit</button>
                                                        <button onClick={async () => { await apiDelete(`${API_BASE_URL}/Hall/${h.id || h.Id}`); const updated = await fetchHallsForSelect(); setHalls(updated); fetchHallsPage(); }} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <PaginationBar page={hallPageNumber} totalPages={hallsPageMeta.totalPages} pageSize={hallPageSize} onPageChange={setHallPageNumber} />
                                </div>
                            </div>
                        )}

                        {adminSubTab === 'screenings' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                                <form onSubmit={handleScreeningSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#161920', padding: '25px', borderRadius: '12px' }}>
                                    <h4 style={{ margin: 0, textAlign: 'center', fontSize: '18px', color: '#deff9a' }}>{editingScreeningId ? 'Edit Screening' : 'Add Screening'}</h4>

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Movie: </label>
                                    <select value={screeningForm.movieId} onChange={(e) => setScreeningForm({ ...screeningForm, movieId: e.target.value })} style={inputStyle}>
                                        <option value="">Select Movie</option>
                                        {movies.map((m) => <option key={m.id || m.Id} value={m.id || m.Id}>{m.title || m.Title}</option>)}
                                    </select>
                                    <InlineError message={fieldErrors.movieId} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Hall: </label>
                                    <select value={screeningForm.hallId} onChange={(e) => setScreeningForm({ ...screeningForm, hallId: e.target.value })} style={inputStyle}>
                                        <option value="">Select Hall</option>
                                        {halls.map((h) => <option key={h.id || h.Id} value={h.id || h.Id}>Hall №{h.hallNum || h.HallNum} ({h.seatsCount || h.SeatsCount} seats)</option>)}
                                    </select>
                                    <InlineError message={fieldErrors.hallId} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Start Time: </label>
                                    <input type="datetime-local" value={screeningForm.startTime} onChange={(e) => setScreeningForm({ ...screeningForm, startTime: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.startTime} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> End Time: </label>
                                    <input type="datetime-local" value={screeningForm.endTime} readOnly style={{ ...inputStyle, backgroundColor: '#2d3748' }} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Screening Type: </label>
                                    <select value={screeningForm.type} onChange={(e) => setScreeningForm({ ...screeningForm, type: e.target.value })} style={inputStyle}>
                                        {SCREENING_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                    </select>

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Ticket Price: </label>
                                    <input type="number" step="0.01" placeholder="Ticket Price" value={screeningForm.price} onChange={(e) => setScreeningForm({ ...screeningForm, price: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.price} />

                                    <button type="submit" style={{ padding: '10px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {editingScreeningId ? 'Update Screening' : 'Add Screening'}
                                    </button>
                                    {editingScreeningId && (
                                        <button type="button" onClick={() => { setEditingScreeningId(null); setScreeningForm({ movieId: '', hallId: '', startTime: '', endTime: '', price: '', type: '0' }); setFieldErrors({}); }} style={{ padding: '10px', backgroundColor: '#232834', color: '#a0aec0', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                    )}
                                </form>

                                <div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input type="text" placeholder="Search Movie Title or Hall..." value={adminScreeningQuery} onChange={e => setAdminScreeningQuery(e.target.value)} style={{ ...inputStyle, width: '280px' }} />
                                        <select value={adminScreeningSortBy} onChange={e => setAdminScreeningSortBy(e.target.value)} style={{ ...inputStyle, width: '180px' }}>
                                            <option value="HallNum">Hall Number</option>
                                            <option value="SeatsCount">Seats Count</option>
                                        </select>
                                        <button onClick={() => setAdminScreeningIsAscending(!adminScreeningIsAscending)} style={{ padding: '10px', background: '#232834', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                            {adminScreeningIsAscending ? '⬆ Asc' : '⬇ Desc'}
                                        </button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#161920', borderRadius: '12px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #232834', color: '#a0aec0', textAlign: 'left' }}>
                                                <th style={{ padding: '15px' }}>Movie</th>
                                                <th style={{ padding: '15px' }}>Hall</th>
                                                <th style={{ padding: '15px' }}>Seats Count</th>
                                                <th style={{ padding: '15px' }}>Time (UTC)</th>
                                                <th style={{ padding: '15px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminScreenings.map((scr) => {
                                                const hallObj = halls.find(h => String(h.id ?? h.Id) === String(scr.hallId || scr.HallId));
                                                const seatsCount = hallObj?.seatsCount ?? hallObj?.SeatsCount ?? 'N/A';
                                                return (
                                                    <tr key={scr.id || scr.Id} style={{ borderBottom: '1px solid #0f1115' }}>
                                                        <td style={{ padding: '15px', color: '#fff' }}>{scr.movieTitle || scr.MovieTitle}</td>
                                                        <td style={{ padding: '15px', color: '#fff' }}>{getHallNumberLabel(scr.hallId || scr.HallId)}</td>
                                                        <td style={{ padding: '15px', color: '#fff' }}>{seatsCount}</td>
                                                        <td style={{ padding: '15px', color: '#deff9a' }}>{displayUTCDate(scr.startTime || scr.StartTime, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td style={{ padding: '15px' }}>
                                                            <button onClick={() => startScreeningEdit(scr)} style={{ background: 'none', border: 'none', color: '#deff9a', marginRight: '10px', cursor: 'pointer' }}>Edit</button>
                                                            <button onClick={() => apiDelete(`${API_BASE_URL}/Screening/${scr.id || scr.Id}`).then(fetchAdminScreenings)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Delete</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <PaginationBar page={adminScreeningPageNumber} totalPages={adminScreeningsMeta.totalPages} pageSize={adminScreeningPageSize} onPageChange={setAdminScreeningPageNumber} />
                                </div>
                            </div>
                        )}

                        {adminSubTab === 'users' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                                <form onSubmit={(e) => { e.preventDefault(); if (editingUserId) handleAdminUserUpdate(editingUserId); else handleAdminUserSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#161920', padding: '25px', borderRadius: '12px' }}>
                                    <h4 style={{ margin: 0, textAlign: 'center', fontSize: '18px', color: '#deff9a' }}>{editingUserId ? 'Edit User' : 'Create New User'}</h4>

                                    <label style={{ display: 'block', color: '#a0aec0' }}> First Name: </label>
                                    <input type="text" placeholder="First Name" value={newUserAdminForm.fName} onChange={(e) => setNewUserAdminForm({ ...newUserAdminForm, fName: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.fname} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Last Name: </label>
                                    <input type="text" placeholder="Last Name" value={newUserAdminForm.lName} onChange={(e) => setNewUserAdminForm({ ...newUserAdminForm, lName: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.lname} />

                                    <label style={{ display: 'block', color: '#a0aec0' }}> Birthday: </label>
                                    <input type="date" value={newUserAdminForm.birthday} onChange={(e) => setNewUserAdminForm({ ...newUserAdminForm, birthday: e.target.value })} style={inputStyle} />

                                    {!editingUserId && (
                                        <>
                                            <label style={{ display: 'block', color: '#a0aec0' }}> Username: </label>
                                            <input type="text" placeholder="Username" value={newUserAdminForm.username} onChange={(e) => setNewUserAdminForm({ ...newUserAdminForm, username: e.target.value })} style={inputStyle} />
                                            <InlineError message={fieldErrors.username} />
                                        </>
                                    )}

                                    <label style={{ display: 'block', color: '#a0aec0' }}>{editingUserId ? 'New Password (leave blank to keep current):' : 'Password:'}</label>
                                    <input type="password" placeholder={editingUserId ? 'Leave blank to keep current password' : 'Password'} value={newUserAdminForm.passwordHash} onChange={(e) => setNewUserAdminForm({ ...newUserAdminForm, passwordHash: e.target.value })} style={inputStyle} />
                                    <InlineError message={fieldErrors.password} />

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                                        <input type="checkbox" checked={newUserAdminForm.isAdmin} onChange={(e) => setNewUserAdminForm({ ...newUserAdminForm, isAdmin: e.target.checked })} />
                                        Set as Admin
                                    </label>
                                    <button type="submit" style={{ padding: '10px', backgroundColor: '#deff9a', color: '#0f1115', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {editingUserId ? 'Update User' : 'Create User'}
                                    </button>
                                    {editingUserId && (
                                        <button type="button" onClick={() => { setEditingUserId(null); setNewUserAdminForm({ username: '', passwordHash: '', fName: '', lName: '', birthday: '', isAdmin: false }); setOriginalUserPasswordHash(''); setFieldErrors({}); }} style={{ padding: '10px', backgroundColor: '#232834', color: '#a0aec0', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                    )}
                                </form>

                                <div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input type="text" placeholder="Search by Username..." value={adminUserSearchQuery} onChange={e => setAdminUserSearchQuery(e.target.value)} style={{ ...inputStyle, width: '220px' }} />
                                        <select value={adminUserSortBy} onChange={e => setAdminUserSortBy(e.target.value)} style={{ ...inputStyle, width: '150px' }}>
                                            <option value="Username">Username</option>
                                            <option value="Role">Role</option>
                                            <option value="Birthday">Birthday</option>
                                        </select>
                                        <button onClick={() => setAdminUserIsAscending(!adminUserIsAscending)} style={{ padding: '10px', background: '#232834', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                            {adminUserIsAscending ? '⬆ Asc' : '⬇ Desc'}
                                        </button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#161920', borderRadius: '12px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #232834', color: '#a0aec0', textAlign: 'left' }}>
                                                <th style={{ padding: '15px' }}>Username</th>
                                                <th style={{ padding: '15px' }}>Name</th>
                                                <th style={{ padding: '15px' }}>Birthday</th>
                                                <th style={{ padding: '15px' }}>Role</th>
                                                <th style={{ padding: '15px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminUsers.map((u) => (
                                                <tr key={u.id || u.Id} style={{ borderBottom: '1px solid #0f1115' }}>
                                                    <td style={{ padding: '15px', color: '#fff' }}>{u.username || u.Username}</td>
                                                    <td style={{ padding: '15px', color: '#fff' }}>{u.fName || u.FName} {u.lName || u.LName}</td>
                                                    <td style={{ padding: '15px', color: '#deff9a' }}>{displayUTCDate(u.birthday || u.Birthday, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                                    <td style={{ padding: '15px', color: (u.isAdmin || u.IsAdmin) ? '#deff9a' : '#a0aec0' }}>{(u.isAdmin || u.IsAdmin) ? 'Admin' : 'User'}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <button onClick={() => startUserEdit(u)} style={{ background: 'none', border: 'none', color: '#deff9a', marginRight: '10px', cursor: 'pointer' }}>Edit</button>
                                                        <button onClick={() => deleteUser(u.id || u.Id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}