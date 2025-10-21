import { Component, OnInit } from '@angular/core';
import { UserService } from '../Services/user.service';
import { PayeService } from '../Services/paye.service';
import { ReservationService } from '../Services/reservation.service';
import { HotelService } from '../Services/hotel.service';
import { ChartOptions } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Hotel {
  id: string;
  nomHotel: string;
  paye_id: string;
  classement: number;
  adresse: string;
  imageHotel: string[];
  datedabut: string;
  datefin: string;
  chambres?: Chambre[];
  startingPrice?: number;
}

interface Chambre {
  id: string;
  hotel_id: string;
  typeChambre?: string;
  prixchambre?: number;
}

interface Reservation{
    dateReservation: string;
    placesDisponibles: number;
    dateDepart: string;
    dateRetour: string;
    typeReservation: string;
    hotel_id: string;
    chambre_id:string;
    avis_id?:Avis[];
}

interface Avis{
    note: number;
    commentaire: string;
    dateAvis: string;
    user_id: string;
    reservation_id:string;
  }

@Component({
  selector: 'app-dashboard2',
  templateUrl: './dashboard2.component.html',
  styleUrls: ['./dashboard2.component.css']
})
export class Dashboard2Component implements OnInit {

  nbUsers: number = 0;
  nbHotels: number = 0;
  nbReservations: number = 0;
  nbpayes: number = 0;

  // Données pour le graphique
  chartLabels: string[] = [];
  chartDataValues: number[] = [];

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: true,
      position: 'top', // Positionner la légende au-dessus du graphique
      labels: {
        boxWidth: 10, // Réduire la largeur des boîtes de couleur
        fontColor: '#666', // Couleur du texte
        usePointStyle: true, // Utiliser un point plutôt qu'un carré
        padding: 10, // Espacement entre les éléments de légende
      },
      align: 'start', // Aligner les éléments de gauche
      fullWidth: true, // Occupent toute la largeur disponible
    },
  };

  constructor(
    private us: UserService,
    private ps: PayeService,
    private rs: ReservationService,
    private hs: HotelService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin([
      this.us.getAllUsers().pipe(catchError(() => of(null))),
      this.ps.getAllPaye().pipe(catchError(() => of(null))),
      this.rs.getAllReservation().pipe(catchError(() => of(null))),
      this.hs.GetAllHotel().pipe(catchError(() => of(null)))
    ]).subscribe(([userData, payeData, reservationData, hotelData]) => {
      if (userData) this.nbUsers = userData.users?.length || 0;
      if (payeData) this.nbpayes = payeData.payes?.length || 0;
      if (reservationData) this.nbReservations = reservationData.reservations?.length || 0;
      if (hotelData) this.nbHotels = hotelData.hotels?.length || 0;

      if (hotelData && payeData) {
        this.prepareChartData(reservationData.reservations,hotelData.hotels);
      }
    });
  }

  prepareChartData(reservations: Reservation[], hotels: Hotel[]): void {
    const hotelsMap = new Map<string, string>();
    for (const hotel of hotels) {
      hotelsMap.set(hotel.id, hotel.nomHotel);
    }
    console.log("**"+hotelsMap)
    

    const countByHotelsName: Map<string, number> = new Map();

    reservations.forEach(reservation => {
      const hotelName = hotelsMap.get(reservation.hotel_id) || 'Inconnu'; // ✅ Correction ici
      console.log("fffff "+hotelName)
      const count = countByHotelsName.get(hotelName) || 0;
      countByHotelsName.set(hotelName, count + 1);
    });

    // Convertir en tableau pour chart.js
    this.chartLabels = Array.from(countByHotelsName.keys());
    this.chartDataValues = Array.from(countByHotelsName.values());

    console.log("Nombre d'hôtels par pays:", Object.fromEntries(countByHotelsName));
  }

  get chartData() {
    return {
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Nombre d\'hôtels par pays',
          data: this.chartDataValues,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0', '#FF9800'
          ]
        }
      ]
    };
  }
}