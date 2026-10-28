# Charlie Foods - Document de Référence

## Énoncé du Problème
Modifications du site web Charlie Foods pour mettre à jour le menu et supprimer la livraison.

## Architecture
- Frontend: React.js avec Tailwind CSS
- Backend: FastAPI (pour API si nécessaire)
- Base de données: MongoDB (pour commandes)
- Intégration: Google Sheets pour les commandes

## Modifications Implémentées (4 Janvier 2026)

### 1. Suppression de la Livraison
- ✅ Option de livraison retirée du formulaire de commande
- ✅ Frais de livraison supprimés
- ✅ Minimum de livraison supprimé
- ✅ Champs adresse/code postal/ville retirés
- ✅ Services mis à jour (Sur place, À emporter uniquement)

### 2. Nouveau Menu "Tastys" Ajouté
- ✅ Tasty Crousty : 9,00€ (Sauce chili thaï et barbecue)
- ✅ Tasty Tenders : 10,00€ (Riz blanc, sauce blanche maison, tenders, oignons crispy, persil)
- ✅ Tasty Escalope : 10,00€ (Riz blanc, sauce blanche maison, escalope fraîche, oignons crispy, persil)
- ✅ Servi avec boisson 33cl

### 3. Menu "Bowl" Mis à Jour
- ✅ Prix: 9,50€
- ✅ Servi avec boisson 33cl
- ✅ 1 viande au choix: Cordon Bleu, Kebab, Tenders, Escalope
- ✅ Sauce fromagère + 2 sauces au choix
- ✅ Supplément cheddar ou raclette +1€

### 4. Catégories Supprimées
- ✅ "Nos Assiettes" supprimé
- ✅ "Sandwich Foie" supprimé

### 5. Sandwich Tenders
- ✅ Présent dans les Sandwichs : 11,00€
- ✅ Ingrédients: demi-baguette, tenders, crudités, cheddar

### 6. Horaires Mis à Jour
- ✅ Lundi: 18h–23h
- ✅ Mardi au Dimanche: 11h–15h et 18h–23h

## Fichiers Modifiés
- `/app/frontend/src/data/mock.js` - Données du menu
- `/app/frontend/src/components/CharlieHome.jsx` - Horaires et affichage
- `/app/frontend/src/components/CartModal.jsx` - Suppression livraison
- `/app/frontend/src/components/CustomizationModal.jsx` - Options Bowl

## Backlog
- P0: Aucun
- P1: Aucun
- P2: Amélioration UX commande
