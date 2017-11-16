import {  MovieList, Component, OnInit, ViewChild, MatDialog, DataSource, MatPaginator, BehaviorSubject,
  Observable, HttpClient, MovieDetailsComponent, MatSelectModule, HostListener } from '../../import-module';

import { HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import { MovieListService } from '../movie-view.service';

@Component({
  selector: 'movieList',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css'],
})

export class MovieListComponent implements OnInit {
  private headers = new HttpHeaders({'Content-Type': 'application/json'});
  displayedColumns = ['title', 'year', 'genre', ];
  dataSource: MovieSource | null;
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  dialogResult = '';
  movieList: MovieList[];
  searchTitle = '';
  searchActor = '';
  searchDirector = '';
  searchWord = '';
  searchCriteria = 1;
  dataChange: BehaviorSubject<MovieList[]> = new BehaviorSubject<MovieList[]>([]);
  validRefresh = false;
  startYear: any = 0;
  endYear: any = new Date().getFullYear();
  have = 0;
  need = 10;
  pageLength = 0;
  genres = [
    {viewValue: 'Action'},
    {viewValue: 'Adventure'},
    {viewValue: 'Animation'},
    {viewValue: 'Biography'},
    {viewValue: 'Comedy'},
    {viewValue: 'Crime'},
    {viewValue: 'Drama'},
    {viewValue: 'Family'},
    {viewValue: 'Fantasy'},
    {viewValue: 'Film-Noir'},
    {viewValue: 'Horror'},
    {viewValue: 'History'},
    {viewValue: 'Music'},
    {viewValue: 'Musical'},
    {viewValue: 'Mystery'},
    {viewValue: 'Romance'},
    {viewValue: 'Sci-Fi'},
    {viewValue: 'Sport'},
    {viewValue: 'Thriller'},
    {viewValue: 'War'},
    {viewValue: 'Western'}];
  selectedGenre: any = [];
  auth: boolean;
  token: string;
  show = true;
  showFilter = false;
  arrow = 'keyboard_arrow_down';
  viewIcon = 'view_comfy';
  viewTooltip = 'Grid view';
  fixedSearch = false;

  constructor(public dialog: MatDialog, private movieListService: MovieListService, private http: HttpClient) {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!(session === null || session.auth === false)) {
      this.auth = session.auth;
      this.token = session.token;
    }
  }

  ngOnInit(): void {
    this.getMovieList();
  }

  toggleButton(): void {
    this.show = !this.show;
    this.show ? this.viewIcon = 'view_comfy' : this.viewIcon = 'format_list_bulleted';
    this.show ? this.viewTooltip = 'Grid view' : this.viewTooltip = 'List view';
    if (!this.show) {
      this.paginator.pageSize = 12;
      this.need = 12;
      this.have = 0;
      this.dataChange = new BehaviorSubject<MovieList[]>([]);
      if (this.searchWord !== '' || this.searchWord !== undefined) {
        this.searchFor();
      } else {
        this.getMovieList();
      }
    }
    if (this.show) {
      this.paginator.pageSize = 10;
      this.fixedSearch = false;
    }
  }

  toggleFilterButton(): void {
      this.showFilter = !this.showFilter;
      this.showFilter ? this.arrow = 'keyboard_arrow_up' : this.arrow = 'keyboard_arrow_down';
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    console.log(document.body.scrollTop);
    if (!this.show) {
      if (document.documentElement.scrollTop || document.body.scrollTop > 100) {
        this.fixedSearch = true;
      } else if (document.documentElement.scrollTop || document.body.scrollTop < 100) {
        this.fixedSearch = false;
      }
      if ((document.documentElement.scrollTop + document.documentElement.offsetHeight === document.documentElement.scrollHeight)
      || (document.body.scrollTop + document.body.offsetHeight === document.body.scrollHeight)) {
        this.have += 12;
        this.need = 12;
        if (this.searchWord !== '' || this.searchWord !== undefined) {
          this.searchFor();
        } else {
          this.getMovieList();
        }
      }
    }
  }

  getAmountOfMatches(): void {
    this.movieListService.getAmountOfMovies(this).then(length => this.pageLength = length);
  }

  /** Get movies and amount from service file. */
  getMovieList(): void {
    this.getAmountOfMatches();
    this.movieListService.getMovieList(this).then(movies => this.createList(movies));
  }

  /** Sets the Movie data displyed on in the Pop-up. */
  openDialog(data) {
    // If user is logged in, check if movie is favorited
    if (this.auth) {
      const params = JSON.stringify({
        token: this.token,
        movie_id: data._id,
      });
      this.http.post('/api/favorites/exists', params, {headers: this.headers}).subscribe(favorites => {
        if (favorites) {
          this.generateModal(data, true);
        } else {
          this.generateModal(data, false);
        }
      });
    } else {
      this.generateModal(data, false);
    }
  }

  generateModal(data, exists) {
    // Generate modal data
    this.movieListService.getMovieModal(data).then( movies => {
      data = {
        '_id': data._id,
        'title': data.title,
        'poster': movies[0].poster,
        'plot': movies[0].plot,
        'runtime': movies[0].runtime,
        'actors': data.actors,
        'director': data.director,
        'genre': data.genre,
        'year': data.year,
        'favorited': exists,
        'auth': this.auth,
      };
      const dialogRef = this.dialog.open(MovieDetailsComponent, {
        data,
      });

      dialogRef.afterClosed().subscribe(result => {
        this.dialogResult = result;
      });
    });
  }

  createList(movieData) {
    this.dataSource = new MovieSource(this, this.paginator);
    /** Fill up the database with 25 movies. */
    for (let i = 0; i < movieData.length ; i++) {
      const copiedData = this.data;
      if (!(this.checkDuplicate(copiedData, i, movieData))) {
        copiedData.push(movieData[i]);
      }
      this.dataChange.next(copiedData);
    }
    if (this.validRefresh === true) {
      this.paginator.length = this.pageLength;
    }
  }

  checkDuplicate(copiedData, i, movieList) {
    for (let k = 0; k < copiedData.length; k++) {
      return movieList[i]._id === copiedData[k]._id;
    }
  }

  get data(): MovieList[] {
    return this.dataChange.value;
  }

  searchDatabase(value) {
    if (value === '' && this.validRefresh === true) {
      this.searchWord = '';
      this.validRefresh = false;
      this.dataChange = new BehaviorSubject<MovieList[]>([]);
      this.paginator.pageIndex = 0;
      this.paginator.length = this.pageLength;
      this.changeValues(this.paginator);

    } else if (value !== '') {
      this.validRefresh = true;
      this.paginator.pageIndex = 0;
      this.have = 0;
      this.need = this.paginator.pageSize;
      this.dataChange = new BehaviorSubject<MovieList[]>([]);
      this.searchWord = value;
      this.searchFor();
    } else {
      this.searchWord = '';
      }
  }

  searchFor() {
    if (this.searchCriteria === 1) {
      this.searchTitle = this.searchWord;

    } else if (this.searchCriteria === 2) {
      this.searchDirector = this.searchWord;

    } else if (this.searchCriteria === 3) {
      this.searchActor = this.searchWord;
    }
    this.getMovieList();
    this.searchTitle = '';
    this.searchDirector = '';
    this.searchActor = '';
  }

  changeValues(event) {
    this.have = this.data.length;
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.need = ((this.paginator.pageIndex + 1) * this.paginator.pageSize) - (this.have);
    if (0 < this.need || this.searchWord !== '') {
      this.searchFor();
    } else {
      this.getMovieList();
    }
  }

  setSearch(num) {
    this.searchCriteria = num.value;
    if (this.searchWord !== '') {
      this.searchDatabase(this.searchWord);
    }
  }

  setYear(event, type) {
    if (type === 'start') {
      this.startYear = event;
    } else {
      this.endYear = event;
    }
    if (this.startYear === '') {
      this.startYear = 0;
    }
    if (this.endYear === '') {
      this.endYear = new Date().getFullYear();
    }
    this.validRefresh = true;
    this.searchDatabase(this.searchWord);
  }

  setGenre(event) {
    this.selectedGenre = '';
    if (event.value[0] !== undefined && event.value[0] !== 'All') {
      for (const genre of event.value) {
        this.selectedGenre += genre;
        this.selectedGenre += ',';
      }
    } else { this.selectedGenre = '';
    }
    this.validRefresh = true;
    this.searchDatabase(this.searchWord);
  }


}

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 **/
export class MovieSource extends DataSource<any> {
  constructor(private _movieComponent: MovieListComponent, private _paginator: MatPaginator) {
    super();
  }
  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<MovieList[]> {
    const displayDataChanges = [
      this._movieComponent.dataChange,
      this._paginator.page,
    ];
    return Observable.merge(...displayDataChanges).map(() => {
      const data = this._movieComponent.data.slice();
      /** Add space between genres. */
      for (let i = 0; i < data.length; i++) {
        data[i].genre = data[i].genre.toString().split(',').join(', ');
      }
  /** Grab the page's slice of data. */
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      return data.splice(startIndex, this._paginator.pageSize);
    });
  }
  disconnect() {}

}
