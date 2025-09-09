import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HydrusBasicFile } from './hydrus-file';
import { SettingsService } from './settings.service';

export interface StereoGenerationRequest {
  file: File;
  shift_amount?: number;
  output_format?: 'png' | 'jpg' | 'jpeg';
}

export interface StereoGenerationResponse {
  status: 'success' | 'error';
  message?: string;
  image_url?: string;
  image_data?: string; // base64 encoded image
}

export interface StereoCacheStats {
  enabled: boolean;
  cache_dir: string;
  lifetime_hours: number;
  total_files: number;
  total_size_mb: number;
}

export interface StereoHealthResponse {
  status: string;
  model_loaded: boolean;
  cache?: StereoCacheStats;
}

@Injectable({
  providedIn: 'root'
})
export class StereoMakerService {

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService
  ) {}

  private get apiUrl(): string {
    return this.settingsService.appSettings.stereoApiUrl;
  }

  /**
   * Generate a stereoscopic image from a Hydrus file
   */
  generateStereoImage(file: HydrusBasicFile, shiftAmount: number = 10, outputFormat: 'png' | 'jpg' | 'jpeg' = 'png'): Observable<Blob> {
    return this.http.get(file.file_url, { responseType: 'blob' }).pipe(
      switchMap(blob => {
        const formData = new FormData();
        formData.append('file', blob, `image.${file.file_type_string.split('/')[1] || 'jpg'}`);
        formData.append('shift_amount', shiftAmount.toString());
        formData.append('output_format', outputFormat);

        return this.http.post(`${this.apiUrl}/generate-stereo/`, formData, {
          responseType: 'blob'
        });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if the stereo maker API is healthy
   */
  checkHealth(): Observable<StereoHealthResponse> {
    return this.http.get<StereoHealthResponse>(`${this.apiUrl}/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Observable<StereoCacheStats> {
    return this.http.get<StereoCacheStats>(`${this.apiUrl}/cache/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Clear the cache
   */
  clearCache(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/cache/clear`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if a file is supported for stereo generation
   */
  isFileSupported(file: HydrusBasicFile): boolean {
    const fileType = file.file_type_string.toLowerCase();

    // Support multiple formats of file type strings
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'jpeg',
      'png',
      'jpg'
    ];

    return supportedTypes.some(type => fileType.includes(type));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Stereo Maker API is not available. Make sure it\'s running';
      } else {
        errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Stereo Maker API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
