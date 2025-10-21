import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OffreService } from '../Services/offre.service';
import { HotelService } from '../Services/hotel.service';

@Component({
  selector: 'app-offre',
  templateUrl: './offre.component.html',
  styleUrls: ['./offre.component.css']
})
export class OffreComponent {
  offers: any[] = [];
  filteredOffers: any[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  searchControl = new FormControl('');
  hotelNames: {[key: string]: string} = {}; // Dictionnaire pour stocker les noms d'hôtels
  
  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  constructor(
    private hotelService: HotelService,
    private offerService: OffreService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOffers();
    
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.filterOffers();
        this.currentPage = 1; // Reset to first page when searching
      });
  }

  getDisplayedRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end}`;
  }

  loadOffers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.offerService.getAllOffer().subscribe({
      next: (response: any) => {
        if (response && response.offres && Array.isArray(response.offres)) {
          this.offers = response.offres;
          this.filteredOffers = [...this.offers];
          this.totalItems = this.offers.length;
          
          // Charger les noms d'hôtels pour toutes les offres
          this.loadHotelNames();
        } else {
          this.errorMessage = 'La structure des données reçues est inattendue';
          console.error(this.errorMessage, response);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des offres';
        console.error(this.errorMessage, err);
        this.isLoading = false;
      }
    });
  }

  loadHotelNames(): void {
    // Récupérer tous les IDs d'hôtels uniques
    const hotelIds = [...new Set(this.offers.map(offer => offer.hotel_id))];
    
    // Pour chaque ID, charger le nom de l'hôtel
    hotelIds.forEach(id => {
      if (id) {
        this.hotelService.getHotelById(id).subscribe({
          next: (hotel) => {
            this.hotelNames[id] = hotel.nomHotel;
          },
          error: (err) => {
            console.error('Erreur lors de la récupération de l\'hôtel', err);
            this.hotelNames[id] = 'N/A';
          }
        });
      }
    });
  }

  getHotelName(id: string): string {
    return this.hotelNames[id] || '';
  }

  filterOffers(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    this.filteredOffers = this.offers.filter(offer => 
      offer.prixParNuit.toString().includes(searchTerm) ||
      offer.promotion.toString().includes(searchTerm) ||
      (this.hotelNames[offer.hotel_id] && this.hotelNames[offer.hotel_id].toLowerCase().includes(searchTerm))
    );
    this.totalItems = this.filteredOffers.length;
  }

  // Pagination methods
  get paginatedOffers(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredOffers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = 1;
    let endPage = this.totalPages;
    
    if (this.totalPages > maxVisiblePages) {
      const half = Math.floor(maxVisiblePages / 2);
      startPage = Math.max(1, this.currentPage - half);
      endPage = startPage + maxVisiblePages - 1;
      
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = endPage - maxVisiblePages + 1;
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  deleteOffer(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this offer?'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.offerService.deleateOffer(id).subscribe({
          next: () => {
            // Remove from local arrays
            this.offers = this.offers.filter(o => o.id !== id);
            this.filteredOffers = this.filteredOffers.filter(o => o.id !== id);
            this.totalItems = this.filteredOffers.length;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.isLoading = false;
            
            if (err.status === 404) {
              alert('Offer not found. It may have already been deleted.');
            } else {
              alert('Error deleting offer. Please try again.');
            }
          }
        });
      }
    });
  }
}