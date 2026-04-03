import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Language } from './models/languages';

@Injectable({ providedIn: 'root' })
export class LanguagesService {

  private api = 'http://localhost:3000/company-languages';

  constructor(private http: HttpClient) { }

  findAll(): Observable<Language[]> {
    return this.http.get<Language[]>(this.api);
  }

  create(dto: Language): Observable<any> {
    return this.http.post(this.api, dto);
  }

  update(id: number, dto: Language): Observable<any> {
    return this.http.patch(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
