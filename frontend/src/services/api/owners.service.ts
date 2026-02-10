import api from './axios.config';
import type { 
  OwnersResponse, 
  SingleOwnerResponse, 
  OwnerMutationResponse,
  CreateOwnerRequest, 
  UpdateOwnerRequest,
  OwnerContractsResponse 
} from '../../types/owner';

/**
 * Servizio per la gestione dei proprietari (Owners).
 * Interfaccia con la API /api/owner
 */
const ownersService = {
  /**
   * Ottiene la lista dei proprietari con paginazione e ricerca.
   */
  getOwners: async (page = 1, limit = 12, search = ''): Promise<OwnersResponse> => {
    const { data } = await api.get<OwnersResponse>('/owner', {
      params: { page, limit, search },
    });
    return data;
  },

  /**
   * Ottiene i dettagli di un singolo proprietario (incluso stats).
   */
  getOwnerById: async (id: number): Promise<SingleOwnerResponse> => {
    const { data } = await api.get<SingleOwnerResponse>(`/owner/${id}`);
    return data;
  },

  /**
   * Crea un nuovo proprietario.
   */
  createOwner: async (ownerData: CreateOwnerRequest): Promise<OwnerMutationResponse> => {
    const { data } = await api.post<OwnerMutationResponse>('/owner', ownerData);
    return data;
  },

  /**
   * Aggiorna un proprietario esistente.
   */
  updateOwner: async (id: number, ownerData: UpdateOwnerRequest): Promise<OwnerMutationResponse> => {
    const { data } = await api.put<OwnerMutationResponse>(`/owner/${id}`, ownerData);
    return data;
  },

  /**
   * Elimina un proprietario (cascade sui contratti).
   */
  deleteOwner: async (id: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/owner/${id}`);
    return data;
  },

  /**
   * Ottiene i contratti associati a un proprietario.
   */
  getOwnerContracts: async (id: number, page = 1, limit = 12): Promise<OwnerContractsResponse> => {
    const { data } = await api.get<OwnerContractsResponse>(`/owner/${id}/contracts`, {
      params: { page, limit },
    });
    return data;
  },
};

export default ownersService;
