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

export interface MapPointImage {
  id: number;
  mapPointId: number;
  imageUrl: string;
  sortOrder: number;
  altText?: string | null;
}

export interface MapPointTranslation {
  id: number;
  mapPointId: number;
  languageCode: string;
  title: string;
  descriptionHtml?: string | null;
}

export interface MapPointContent {
  point: MapPointResponse;
  images: MapPointImage[];
  translations: MapPointTranslation[];
  translation: MapPointTranslation | null;
}

export interface MapPointTranslationPayload {
  languageCode: string;
  title: string;
  descriptionHtml?: string | null;
}

export interface MapPointPositionPayload {
  x: number;
  y: number;
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

  updatePosition(id: string | number, payload: MapPointPositionPayload): Observable<MapPointResponse> {
    return this.http.patch<MapPointResponse>(`${this.api}/${id}/position`, payload);
  }

  getContent(id: string | number, languageCode: string): Observable<MapPointContent> {
    return this.http.get<MapPointContent>(`${this.api}/${id}/content`, {
      params: { language: languageCode },
    });
  }

  upsertTranslation(
    id: string | number,
    payload: MapPointTranslationPayload
  ): Observable<MapPointTranslation> {
    return this.http.patch<MapPointTranslation>(`${this.api}/${id}/translations`, payload);
  }

  uploadImage(id: string | number, file: File): Observable<MapPointImage> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<MapPointImage>(`${this.api}/${id}/images`, formData);
  }

  updateImage(imageId: number, payload: Partial<Pick<MapPointImage, 'altText' | 'sortOrder'>>): Observable<MapPointImage> {
    return this.http.patch<MapPointImage>(`${this.api}/images/${imageId}`, payload);
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/images/${imageId}`);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
