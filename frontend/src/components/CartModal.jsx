import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useCart } from './CartContext';

const CartModal = ({ isOpen, onClose }) => {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderType, setOrderType] = useState(''); // 'emporter', 'sur-place'
  const [orderData, setOrderData] = useState({
    name: '',
    phone: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState(null); // Store order result
  const [errors, setErrors] = useState({});

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowOrderForm(false);
      setOrderType('');
      setOrderData({
        name: '',
        phone: '',
        comment: ''
      });
      setErrors({});
      setOrderResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Total without delivery
  const totalFinal = parseFloat(total);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData({
      ...orderData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nom obligatoire
    if (!orderData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    // Téléphone valide français
    const phonePattern = /^(06|07)[0-9]{8}$/;
    if (!orderData.phone.trim()) {
      newErrors.phone = 'Le téléphone est obligatoire';
    } else if (!phonePattern.test(orderData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format invalide (ex: 06XXXXXXXX)';
    }

    // Type de commande obligatoire
    if (!orderType) {
      newErrors.orderType = 'Veuillez choisir un type de commande';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction utilitaire pour parser les prix correctement
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanPrice = priceStr.toString().replace(',', '.').replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleanPrice);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fonction pour normaliser le téléphone
  const normalizePhone = (phone) => {
    return phone.replace(/[\s\-\.]/g, '');
  };

  // Plus de normalizeItemName - les noms sont déjà propres

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    console.log('🚀 Starting order submission...');

    try {
      // Préparer les données pour Google Sheets avec le nouveau format
      const orderDetails = {
        token: "MOS123",
        typeCommande: orderType,
        nom: orderData.name.trim(),
        telephone: normalizePhone(orderData.phone),
        adresse: '',
        codePostal: '',
        ville: '',
        commentaire: orderData.comment.trim() || '',
        panier: items.map(item => {
          // Nom de base propre (déjà uniformisé dans mock.js)
          let cleanName = item.name.trim();
          
          // Assembler avec les options SEULEMENT si présentes
          if (item.options && item.options.optionsText && item.options.optionsText.trim()) {
            cleanName = `${cleanName} - ${item.options.optionsText.trim()}`;
          }
          
          return {
            name: cleanName,
            qty: parseInt(item.quantity),
            price: parsePrice(item.price),
            options: item.options || {}
          };
        }),
        total: parsePrice(total.toFixed(2)),
        fraisLivraison: 0
      };

      console.log('📊 Payload to send:', JSON.stringify(orderDetails, null, 2));

      // Use form-urlencoded to avoid CORS issues with Google Apps Script
      console.log('📡 Attempting form-urlencoded POST (CORS-safe)...');
      const response = await fetch('https://script.google.com/macros/s/AKfycbzQjUSqw6MD9CUyPcpidnR43oAa9zarwO2AMVA829srp164Qu90VQaxmS3qXPDJtdC-/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `payload=${encodeURIComponent(JSON.stringify(orderDetails))}`
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get raw response text first
      const responseText = await response.text();
      console.log('📊 Raw response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📤 Parsed JSON response:', result);
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        throw new Error(`Response not valid JSON. Status: ${response.status}, Text: ${responseText}`);
      }
      
      // Check for successful response
      if (response.status === 200 && result && result.ok === true) {
        console.log('✅ Order submitted successfully!', result);
        setOrderResult(result); // Store the result for display
        setOrderSubmitted(true);
        clearCart();
        
        // Show success message with order ID
        console.log(`🎉 Order ID: ${result.order_id}, Message: ${result.message}`);
        
        // Fermer automatiquement après 4 secondes
        setTimeout(() => {
          setOrderSubmitted(false);
          setOrderResult(null);
          setShowOrderForm(false);
          setOrderType('');
          setOrderData({ name: '', phone: '', comment: '' });
          onClose();
        }, 4000);
      } else {
        // Handle error response
        const errorMessage = result?.message || `HTTP ${response.status}: ${responseText}`;
        console.error('❌ Order submission failed:', errorMessage);
        alert(`Erreur lors de l'envoi: ${errorMessage}`);
      }

    } catch (networkError) {
      console.error('❌ Network/fetch error:', networkError);
      alert(`Erreur de connexion: ${networkError.message}. Veuillez appeler le restaurant au 09 86 15 17 24.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Message de succès
  if (orderSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Merci pour votre commande !
          </h2>
          <p className="text-gray-600 mb-4">
            Votre commande a été transmise au restaurant Charlie Foods.
          </p>
          {orderResult && orderResult.order_id && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700">Numéro de commande :</p>
              <p className="text-lg font-bold text-[#E30613]">{orderResult.order_id}</p>
            </div>
          )}
          <div className="bg-[#E30613] text-white p-3 rounded-lg">
            <p className="font-medium">Vous serez contacté sous peu au :</p>
            <p className="text-lg font-bold">{orderData.phone}</p>
          </div>
          {orderResult && orderResult.message && (
            <p className="text-xs text-gray-500 mt-3">{orderResult.message}</p>
          )}
        </div>
      </div>
    );
  }

  const getMenuNote = (categoryName) => {
    const menuCategories = ['🍔✨ Nos Gourmets', '🍔 Nos Burgers', '🥖 Nos Sandwichs Baguette', '🍽️ Assiettes', '🌯 Tacos'];
    if (menuCategories.some(cat => categoryName.includes(cat.replace(/🍔✨|🍔|🥖|🍽️|🌯/g, '').trim()))) {
      return ' (inclus: frites + boisson 33cl)';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ShoppingCart className="mr-2" />
            {showOrderForm ? 'Finaliser la commande' : 'Mon Panier'}
            <span className="text-xs ml-2 bg-yellow-200 px-2 py-1 rounded">{showOrderForm ? 'FORM' : 'CART'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {!showOrderForm ? (
          // Vue du panier
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Votre panier est vide</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.name}
                        <span className="text-sm text-gray-600">
                          {getMenuNote(item.category)}
                        </span>
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      {item.options?.optionsText && (
                        <p className="text-xs text-blue-700 mt-1 font-medium">
                          [{item.options.optionsText}]
                        </p>
                      )}
                      <p className="text-[#E30613] font-bold">{item.price}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
                        title="Diminuer la quantité"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="w-10 text-center font-bold bg-white text-gray-900 border-2 border-gray-300 rounded px-3 py-2 text-sm shadow-sm">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
                        title="Augmenter la quantité"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 ml-2 shadow-sm"
                        title="Supprimer l'article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Formulaire de commande
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Type de commande */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Type de commande *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'emporter', label: '🥡 À emporter', extra: '' },
                    { value: 'sur-place', label: '🍽️ Sur place', extra: '' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setOrderType(option.value)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        orderType === option.value 
                          ? 'border-[#E30613] bg-[#E30613] text-white font-semibold' 
                          : 'border-gray-300 hover:border-[#E30613] text-gray-900 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      {option.extra && <div className="text-xs opacity-90">{option.extra}</div>}
                    </button>
                  ))}
                </div>
                {errors.orderType && <p className="text-red-600 text-sm mt-1 font-medium bg-white px-2 py-1 rounded">{errors.orderType}</p>}
              </div>

              {/* Informations client */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="name"
                  value={orderData.name}
                  onChange={handleInputChange}
                  placeholder="Votre nom et prénom"
                  className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-600 text-sm mt-1 font-medium bg-white px-2 py-1 rounded">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Téléphone * (06XXXXXXXX ou 07XXXXXXXX)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={orderData.phone}
                  onChange={handleInputChange}
                  placeholder="06 12 34 56 78"
                  className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1 font-medium bg-white px-2 py-1 rounded">{errors.phone}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  name="comment"
                  value={orderData.comment}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613]"
                  placeholder="Instructions spéciales..."
                />
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Récapitulatif de votre commande</h4>
                {items.map((item, index) => (
                  <div key={index} className="text-sm mb-1 text-gray-900">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">{(parsePrice(item.price) * item.quantity).toFixed(2)}€</span>
                    </div>
                    {item.options?.optionsText && (
                      <div className="text-xs text-blue-700 ml-4">
                        [{item.options.optionsText}]
                      </div>
                    )}
                  </div>
                ))}
                <hr className="my-2 border-gray-400" />
                <div className="flex justify-between text-sm mb-1 text-gray-900">
                  <span>Sous-total</span>
                  <span className="font-medium">{total.toFixed(2)}€</span>
                </div>
                <hr className="my-2 border-gray-400" />
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span className="text-[#E30613]">{totalFinal.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-gray-800 mt-2">
                  💰 Paiement à la remise
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="border-t p-4">
          {!showOrderForm ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-900">
                  Total: {total.toFixed(2)}€
                </div>
                <button 
                  onClick={() => clearCart()}
                  disabled={items.length === 0}
                  className="border border-red-500 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50 px-4 py-2 rounded-lg font-medium"
                >
                  Vider le panier
                </button>
              </div>
              <button 
                onClick={() => {
                  console.log('Setting showOrderForm to true');
                  setShowOrderForm(true);
                }}
                className="w-full bg-[#E30613] hover:bg-[#B8050F] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                disabled={items.length === 0}
              >
                Commander ({total.toFixed(2)}€)
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button 
                type="button"
                onClick={() => setShowOrderForm(false)}
                className="flex-1 border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg font-medium"
              >
                Retour au panier
              </button>
              <button 
                type="submit"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-[#E30613] hover:bg-[#B8050F] text-white px-4 py-2 rounded-lg font-medium flex-1 disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi...' : `Confirmer (${totalFinal.toFixed(2)}€)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;