import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Smtp } from './models/smtp';

@Injectable({ providedIn: 'root' })
export class MailService {

  private api = 'http://localhost:3000/smtp';

  constructor(private http: HttpClient) { }

  find(): Observable<Smtp> {
    return this.http.get<Smtp>(this.api);
  }

  create(smtp: Smtp): Observable<any> {
    const dto = {
      host: smtp.host,
      port: smtp.port,
      security: smtp.security,
      username: smtp.username,
      password: smtp.password,
      email: smtp.email
    };
    return this.http.post(this.api, dto);
  }

  update(id: number, smtp: Smtp): Observable<any> {
    const dto = {
      id: smtp.id,
      host: smtp.host,
      port: smtp.port,
      security: smtp.security,
      username: smtp.username,
      password: smtp.password,
      email: smtp.email
    };
    return this.http.patch(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  testEmail(dto: Smtp, email: string): Observable<any> {
    return this.http.post(`${this.api}/test`, {
      ...dto,
      testEmail: email
    });
  }
}
