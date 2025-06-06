import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import JobOfferForm from '../components/JobOfferForm';
import JobOfferDetails from '../components/JobOfferDetails';
import { useOffersStore } from '../stores/offersStore';

function OffreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);

  const { offers, updateOffer } = useOffersStore();
  const offer = offers.find(o => o.id === parseInt(id || '0'));

  if (!offer) {
    return (
      <div>
        <div className="mb-8">
          <Link
            to="/offres"
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la liste
          </Link>
        </div>
        <p className="text-center text-gray-500">Cette offre n'existe pas.</p>
      </div>
    );
  }

  const handleEdit = (data: any) => {
    updateOffer(offer.id, data);
    setShowEditForm(false);
  };

  if (showEditForm) {
    return (
      <JobOfferForm 
        offer={offer} 
        onSubmit={handleEdit} 
        onClose={() => setShowEditForm(false)} 
        isEditing={true} 
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/offres"
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à la liste
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
        <button
          onClick={() => setShowEditForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Modifier l'offre
        </button>
      </div>

      <JobOfferDetails 
        offer={offer} 
        onClose={() => navigate('/offres')}
        onEdit={() => setShowEditForm(true)}
      />
    </div>
  );
}

export default OffreDetail;