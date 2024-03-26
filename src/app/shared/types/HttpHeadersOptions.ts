import { HttpHeaders } from '@angular/common/http';

export interface HttpHeadersOptions {
  headers: HttpHeaders;
  withCredentials?: boolean;
}
