import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ApiResFull,
  BlobWithFileName,
  HttpHeadersOptions,
  ApiResponseType
} from '@type/index';
import { isEmpty as _isEmpty } from 'lodash';
import { EnvService } from './env.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  getAuthenticationToken(): string {
    const token = this.getUserData('next_partner');
    if (token) {
      return 'Bearer ' + token;
    }
    return '';
  }

  getUserData(key: string): string {
    return localStorage.getItem(key) as string;
  }

  /**
   * This function is used to build the request options
   *
   * @returns The RequestOptions
   */
  public buildRequestOptions(): HttpHeadersOptions {
    return {
      headers: new HttpHeaders({
        Authorization: this.getAuthenticationToken()
      })
    };
  }

  /**
   * This function is used to build the request with headers
   *
   * @returns RequestOptions to be used for Api Call
   */
  private buildRequestWithHeader(): HttpHeadersOptions {
    const headers: HttpHeaders = this.buildHeaders();
    if (this.getUserData('next_partner')) {
      return {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: this.getAuthenticationToken()
        })
      };
    }
    return {
      headers
    };
  }

  /**
   * This function is used to build headers
   *
   * @returns ApiHeaders to be sent
   */
  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * This function is used to return the Url
   *
   * @param path the Api call Route
   * @returns The URl to be used for calling an Api
   */
  getUrl(path: string, params?: any): string {
    let url = this.envService.env.apiBaseUrl + path;
    if (params != null && !_isEmpty(params)) {
      url += '?' + this.convertToFormString(params);
    }
    return url;
  }

  constructor(private http: HttpClient, private envService: EnvService) {}

  /**
   * This function is used to call Api using Get Option
   *
   * @param path the Api call Route
   * @returns An observable containing ApiRes
   */
  httpGet(
    path?: string,
    query?: any,
    disableCredentials?: boolean,
    changeUrl = ''
  ): Observable<ApiResponseType<any>> {
    const params = query || {};
    return this.http
      .get(
        changeUrl === '' ? this.getUrl(path as string, params) : changeUrl,
        disableCredentials === true
          ? { withCredentials: false }
          : this.buildRequestOptions()
      )
      .pipe(
        map((res: any) => res),
        catchError(this.handleError)
      );
  }

  /**
   * This function is used to call Api using Get Option
   *
   * @param path the Api call Route
   * @returns An observable containing ApiRes
   */
  httpGetString(path: string): string {
    return this.getUrl(path);
  }
  /**
   * This function is used to call Api using Post Option
   *
   * @param path the Api call Route
   * @param data the Queryparam to be sent to the Api Call
   * @param formData post payload
   * @returns An observable containing ApiRes
   */
  httpPost(
    path?: string,
    data: any = null,
    formData: boolean = false,
    changeUrl = ''
  ): Observable<any> {
    const header: HttpHeadersOptions = formData
      ? this.buildRequestOptions()
      : this.buildRequestWithHeader();
    return this.http
      .post(
        changeUrl === '' ? this.getUrl(path as string, null) : changeUrl,
        data,
        header
      )
      .pipe(
        map((res: any) => res),
        catchError(this.handleError)
      );
  }

  /**
   * This function is used to call Api using Post Option
   *
   * @param path the Api call Route
   * @param data the Queryparam to be sent to the Api Call
   * @param formData post payload
   * @returns An observable containing ApiRes
   */
  httpPut(
    path?: string,
    data: any = null,
    formData: boolean = false,
    changeUrl = ''
  ): Observable<any> {
    const header: HttpHeadersOptions = formData
      ? this.buildRequestOptions()
      : this.buildRequestWithHeader();
    return this.http
      .put(
        changeUrl === '' ? this.getUrl(path as string) : changeUrl,
        data,
        header
      )
      .pipe(
        map((res: any) => res),
        catchError(this.handleError)
      );
  }

  /**
   * This function is used to call Api using Delete Option
   *
   * @param path the Api call Route
   * @returns An observable containing ApiRes
   */
  httpDelete(path?: string, changeUrl = ''): Observable<any> {
    const header: HttpHeadersOptions = this.buildRequestWithHeader();
    return this.http
      .delete(
        changeUrl === '' ? this.getUrl(path as string) : changeUrl,
        header
      )
      .pipe(
        map((res: any) => res),
        catchError(this.handleError)
      );
  }

  httpFileUpload(path: string, formData: any): Observable<any> {
    const options: HttpHeadersOptions = this.buildRequestOptions();
    return this.http.post(this.getUrl(path), formData, options).pipe(
      map((res: any) => res),
      catchError(this.handleError)
    );
  }

  downloadFileAsBlob(
    path: string,
    clientFileName?: string
  ): Observable<BlobWithFileName | never> {
    return this.http
      .get(path, {
        withCredentials: true,
        observe: 'response',
        responseType: 'blob'
      })
      .pipe(
        map((res: ApiResFull) => {
          const contentDisposition: string = res.headers.get(
            'Content-Disposition'
          );
          const fileName: string =
            clientFileName ||
            contentDisposition
              .split(';')[1]
              .trim()
              .split('=')[1]
              .replace(/"/g, '');
          return {
            FileName: fileName,
            Blob: res.body
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * This function is used to readCookie
   *
   * @param name The Cookie Name
   * @returns the cookie value
   */
  readCookie(name: string): any {
    const v: any = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
  }

  /**
   * This function is used to extract the data from the Api
   *
   * @param response The response obtained from the Api
   * @returns The response body
   */
  protected extractData(response: Response): any {
    const body: any = response.json();
    return body || {};
  }

  /**
   * This function is used to handle the errors for an Api
   *
   * @param error The response obtained from the Api
   * @returns Throws an Error
   */
  handleError(error: any): Observable<any> {
    const statusCode = error?.status;
    const auth = window.location.href.split('/').includes('auth');
    if (!auth) {
      if (statusCode === 401 || statusCode === 403) {
        window.location.href = this.envService?.env?.baseUrl + '/auth/login';
      }
    }
    return throwError(() => error || {});
  }

  private convertToFormString(obj: any) {
    let result = '';
    for (const key in obj) {
      if (obj?.key) {
        let value = obj[key];
        if (value !== 0 && value !== false && !value) {
          continue;
        }
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        if (result) {
          result += '&';
        }
        result += key + '=' + encodeURIComponent(value);
      }
    }
    return result;
  }
}
