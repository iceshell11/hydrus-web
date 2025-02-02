import { TestBed } from '@angular/core/testing';

import { HydrusViewsService } from './hydrus-views.service';

describe('HydrusViewsService', () => {
  let service: HydrusViewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HydrusViewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
