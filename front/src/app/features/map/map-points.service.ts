import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MapPointPayload {
  label: string;
  description: string;
  type: 'interest' | 'info';
  x: number;
  y: number;
  userId?: number;
}

export interface MapPointResponse extends MapPointPayload {
  id: string | number;
}

@Injectable({ providedIn: 'root' })
export class MapPointsService {
  private readonly api = 'http://localhost:3000/map-points';

  constructor(private http: HttpClient) { }

  findAll(): Observable<MapPointResponse[]> {
    return this.http.get<MapPointResponse[]>(this.api);
  }

  create(payload: MapPointPayload): Observable<MapPointResponse> {
    return this.http.post<MapPointResponse>(this.api, payload);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
