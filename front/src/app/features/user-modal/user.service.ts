import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './models/users';

@Injectable({ providedIn: 'root' })
export class UserService {

  private api = 'http://localhost:3000/users';

  constructor(private http: HttpClient) { }

  findAll(): Observable<User[]> {
    return this.http.get<any[]>(this.api);
  }

  create(dto: User): Observable<any> {
    return this.http.post(this.api, dto);
  }

  update(id: number, dto: User): Observable<any> {
    return this.http.patch(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  changePassword(userId: number, password: string) {
    return this.http.patch(
      `${this.api}/password/${userId}`,
      { password }
    );
  }
}
