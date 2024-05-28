const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5001;
// Route pour insérer un utilisateur dans la base de données
app.use(express.json());

app.use(cors());
app.use(bodyParser.json());
// Configuration de la connexion à la base de données
const connection = mysql.createConnection({
    host: '192.168.65.105',
    user: 'debian',
    password: 'root',
    database: 'sandbox2_projet_bts'
});

// Connecter à la base de données
connection.connect((err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});

// Middleware pour analyser les requêtes JSON
// Middleware pour gérer les erreurs JSON
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError) {
        console.error('Erreur de syntaxe JSON :', error);
        console.log('Corps de la requête :', req.body);
        res.status(400).json({ error: 'Erreur de syntaxe JSON dans la requête' });
    } else {
        next();
    }
});

//recupere tout les information de utilisateur et occupation dun utilisateur avec laide de id utilisateur
app.get('/utilisateurs', (req, res) => {
    const query = `
        SELECT 
            u.id_utilisateur, 
            u.isadmin_utilisateur, 
            u.nom_utilisateur, 
            u.prenom_utilisateur, 
            u.classe_utilisateur, 
            u.badge_utilisateur, 
            u.photo_utilisateur, 
            u.password_utilisateur, 
            u.telephone_utilisateur, 
            u.mail_utilisateur, 
            u.infos_utilisateur, 
            u.quota_utilisateur, 
            o.id_occupation, 
            o.id_utilisateur_occupation, 
            o.numerobox_occupation, 
            o.heure_depot_occupation AS heure_depot, 
            o.heure_retrait_occupation AS heure_retrait 
        FROM utilisateur u
        JOIN occupation o ON u.id_utilisateur = o.id_utilisateur_occupation
    `;

    // Affichage de la requête reçue
    console.log('Requête reçue pour récupérer tous les utilisateurs et leurs occupations');

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des éléments :', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des éléments' });
            return;
        }

        // Affichage des informations de réponse
        console.log('Résultats de la requête :', results);

        res.json(results);
    });
});

// Route pour récupérer les éléments de la base de données avec le badge
app.get('/utilisateurs/badge_utilisateur', (req, res) => {
    console.log(req.body);
    //const { badge_utilisateur } = req.body;
    const badge_utilisateur = req.query.badge_utilisateur;
    console.log(badge_utilisateur);
    connection.query('SELECT * FROM `utilisateur` WHERE utilisateur.badge_utilisateur = ?', [badge_utilisateur], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des éléments :', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des éléments' });
            return;
        }
        res.json(results);
    });
});

// Route pour récupérer le quota utilisateur et dernier heure depot utilisation avec le badge
app.get('/utilisateurs/badge_utilisateur/quota-depot', (req, res) => {
    console.log(req.body);
    //const { badge_utilisateur } = req.body;
    const badge_utilisateur = req.query.badge_utilisateur;
    console.log(badge_utilisateur);
    connection.query('SELECT u.quota_utilisateur, o.heure_depot_occupation FROM utilisateur u JOIN occupation o ON u.id_utilisateur = o.id_utilisateur_occupation WHERE u.badge_utilisateur = ? ORDER BY o.heure_depot_occupation DESC LIMIT 1;', [badge_utilisateur], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des éléments :', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des éléments' });
            return;
        }
        res.json(results);
    });
});



// Route pour récupérer le quota utilisateur et la dernière heure de dépôt d'utilisation avec le badge
app.get('/utilisateurs/badge_utilisateur/quota-depot/:uid', (req, res) => {
    const badge_utilisateur = req.params.uid;
    console.log('Badge utilisateur reçu :', badge_utilisateur);

    connection.query(
        `SELECT u.quota_utilisateur, CASE WHEN o.id_occupation IS NULL THEN NULL ELSE o.heure_depot_occupation 
        END AS heure_depot_occupation FROM utilisateur u LEFT JOIN occupation o ON u.id_utilisateur = o.id_utilisateur_occupation 
        WHERE u.badge_utilisateur = ? ORDER BY o.heure_depot_occupation DESC LIMIT 1;`,
        [badge_utilisateur],
        (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des éléments :', error);
                res.status(500).json({ error: 'Erreur lors de la récupération des éléments' });
                return;
            }
            console.log('Résultats récupérés pour le badge utilisateur :', badge_utilisateur);
            console.log('Résultats :', results);
            res.json(results);
        }
    );
});




app.post('/utilisateurs', (req, res) => {
    console.log(req.body);
    const { nom_utilisateur, prenom_utilisateur, classe_utilisateur, badge_utilisateur, password_utilisateur, telephone_utilisateur, mail_utilisateur, quota_utilisateur } = req.body;
    connection.query('INSERT INTO utilisateur (nom_utilisateur, prenom_utilisateur, classe_utilisateur, badge_utilisateur, password_utilisateur, telephone_utilisateur, mail_utilisateur, quota_utilisateur) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [nom_utilisateur, prenom_utilisateur, classe_utilisateur, badge_utilisateur, password_utilisateur, telephone_utilisateur, mail_utilisateur, quota_utilisateur], (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'insertion de l\'utilisateur :', error);
            res.status(500).json({ error: 'Erreur lors de l\'insertion de l\'utilisateur' });
            return;
        }
        console.log("requete insertion ok");
        res.status(201).json({ message: 'Utilisateur inséré avec succès', id_utilisateur_inséré: results.insertId });
    });
});


// Route pour supprimer un utilisateur de la base de données en utilisant l'id_utilisateur
app.delete('/utilisateurs', (req, res) => {
    const { id_utilisateur } = req.body;
    console.log(req.body);

    // Supprimer l'utilisateur
    connection.query('DELETE FROM utilisateur WHERE id_utilisateur = ?', [id_utilisateur], (error, results) => {
        if (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur :', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }
        
        console.log("Requête DELETE réussie");
        res.json({ message: 'Utilisateur supprimé avec succès' });
    });
});

// Route pour mettre à jour toutes les informations d'un utilisateur en fonction du prénom et du nom
app.put('/utilisateurs', (req, res) => {
    const { prenom_utilisateur, nom_utilisateur, ...otherInfo } = req.body;

    // Construire la chaîne SQL pour mettre à jour les informations autres que le prénom et le nom de l'utilisateur
    let updateQuery = '';
    const updateParams = [];

    for (const key in otherInfo) {
        updateQuery += `${key} = ?, `;
        updateParams.push(req.body[key]);
    }
    updateQuery = updateQuery.slice(0, -2); // Supprimer la virgule finale

    // Mettre à jour les informations de l'utilisateur
    const query = `UPDATE utilisateur SET ${updateQuery} WHERE prenom_utilisateur = ? AND nom_utilisateur = ?`;

    connection.query(query, [...updateParams, prenom_utilisateur, nom_utilisateur], (error, results) => {
        if (error) {
            console.error('Erreur lors de la mise à jour des informations de l\'utilisateur :', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour des informations de l\'utilisateur' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }
        console.log("Requête UPDATE réussie");
        res.json({ message: 'Informations de l\'utilisateur mises à jour avec succès' });
    });
});







// Route pour insérer les informations des boxs
app.post('/info', (req, res) => {
    const { greenEnergy, boxState, date } = req.body;

    console.log("Données reçues du body : ", req.body);
 // Stocker la date reçue dans une variable nommée joris
 const joris = date;

    // Construire la chaîne SQL pour insérer les informations des boxs
    const insertQuery = `
        INSERT INTO info (box1, box2, box3, box4, box5, box6, box7, box8, temps_vert_box, info_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
    `;

    // Préparer les valeurs à insérer
    const values = [
        boxState[0],
        boxState[1],
        boxState[2],
        boxState[3],
        boxState[4],
        boxState[5],
        boxState[6],
        boxState[7],
        greenEnergy,
    ];

    // Insérer les informations des boxs
    connection.query(insertQuery, values, (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'insertion des informations des boxs :', error);
            res.status(500).json({ error: 'Erreur lors de l\'insertion des informations des boxs' });
            return;
        }
        console.log("Requête d'insertion des boxs réussie");
        res.json({ message: 'Informations des boxs insérées avec succès' });
    });
});

//SELECT SUM(CASE WHEN temps_vert_box = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100 AS pourcentage_energie_vert FROM info WHERE box1 = 1 AND info_date BETWEEN NOW() - INTERVAL 1 DAY AND NOW();







// Route pour insérer un utilisateur dans la base de données
app.use(express.json());
// Route pour obtenir les pourcentages de temps
app.get('/utilisateur/pourcentage', (req, res) => {
    const id_utilisateur = req.query.id_utilisateur;
    const intervalle = req.query.intervalle;

    // Affichage des informations reçues
    console.log(`Requête reçue avec id_utilisateur: ${id_utilisateur} et intervalle: ${intervalle}`);

    const query = `
        WITH Intervals AS (
            SELECT 
                i.*, 
                o.numerobox_occupation,
                TIMESTAMPDIFF(SECOND, LAG(i.info_date) OVER (ORDER BY i.info_date), i.info_date) AS interval_in_seconds
            FROM 
                info i
            JOIN 
                occupation o ON i.info_date BETWEEN o.heure_depot_occupation AND o.heure_retrait_occupation
            WHERE 
                o.id_utilisateur_occupation = ?
                AND o.heure_depot_occupation BETWEEN CURDATE() - INTERVAL ? DAY AND CURDATE()
                AND o.heure_retrait_occupation BETWEEN CURDATE() - INTERVAL ? DAY AND CURDATE()
                AND (
                    (o.numerobox_occupation = 1 AND i.box1 = 1) OR
                    (o.numerobox_occupation = 2 AND i.box2 = 1) OR
                    (o.numerobox_occupation = 3 AND i.box3 = 1) OR
                    (o.numerobox_occupation = 4 AND i.box4 = 1) OR
                    (o.numerobox_occupation = 5 AND i.box5 = 1) OR
                    (o.numerobox_occupation = 6 AND i.box6 = 1) OR
                    (o.numerobox_occupation = 7 AND i.box7 = 1) OR
                    (o.numerobox_occupation = 8 AND i.box8 = 1)
                )
        )
        SELECT 
            SUM(CASE WHEN temps_vert_box = 1 THEN interval_in_seconds ELSE 0 END) AS sum_temps_vert,
            SUM(CASE WHEN temps_vert_box = 0 THEN interval_in_seconds ELSE 0 END) AS sum_temps_non_vert,
            (SUM(CASE WHEN temps_vert_box = 1 THEN interval_in_seconds ELSE 0 END) /
            (SUM(CASE WHEN temps_vert_box = 0 THEN interval_in_seconds ELSE 0 END) + SUM(CASE WHEN temps_vert_box = 1 THEN interval_in_seconds ELSE 0 END)) * 100) AS pourcentage_temps_vert,
            (SUM(CASE WHEN temps_vert_box = 0 THEN interval_in_seconds ELSE 0 END) /
            (SUM(CASE WHEN temps_vert_box = 0 THEN interval_in_seconds ELSE 0 END) + SUM(CASE WHEN temps_vert_box = 1 THEN interval_in_seconds ELSE 0 END)) * 100) AS pourcentage_temps_non_vert
        FROM 
            Intervals;
    `;

    connection.query(query, [id_utilisateur, intervalle, intervalle], (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'exécution de la requête :', error);
            res.status(500).json({ error: 'Erreur lors de l\'exécution de la requête' });
            return;
        }

        // Affichage des informations de réponse
        console.log('Résultats de la requête :', results);

        res.json(results);
    });
});





/*****************************************************************************************************************************/
/*                                                                                                                           */
/*****************************************************************************************************************************/
// Route pour la connexion
// Route pour la connexion
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    console.log('Requête de connexion reçue');
    console.log('Nom d\'utilisateur :', username);
    console.log('Mot de passe :', password);
  
    // Vérifier les informations d'identification de l'utilisateur dans la base de données
    connection.query(
      'SELECT id_utilisateur, nom_utilisateur, prenom_utilisateur, classe_utilisateur FROM utilisateur WHERE CONCAT(prenom_utilisateur, ".", nom_utilisateur) = ? AND password_utilisateur = ?',
      [username, password],
      (error, results) => {
        if (error) {
          console.error('Error during login:', error);
          res.status(500).json({ success: false, message: 'Erreur lors de la connexion' });
          return;
        }
  
        console.log('Résultats de la requête :', results);
  
        if (results.length === 0) {
          res.status(401).json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' });
          return;
        }
  
        const user = {
          id_utilisateur: results[0].id_utilisateur,
          nom_utilisateur: results[0].nom_utilisateur,
          prenom_utilisateur: results[0].prenom_utilisateur,
          classe_utilisateur: results[0].classe_utilisateur,
        };
  
        // Générer un jeton d'authentification ou renvoyer les informations utilisateur
        res.json({ success: true, message: 'Connexion réussie', user });
      }
    );
  });



  app.get('/utilisateurs/quota/:username', (req, res) => {
    const username = req.params.username;
    console.log('Requête de quota reçue pour :', username);
  
    connection.query(
      'SELECT quota_utilisateur FROM utilisateur WHERE CONCAT(prenom_utilisateur, ".", nom_utilisateur) = ?',
      [username],
      (error, results) => {
        if (error) {
          console.error('Error during quota request:', error);
          res.status(500).json({ success: false, message: 'Erreur lors de la récupération du quota' });
          return;
        }
  
        console.log('Résultats de la requête :', results);
  
        if (results.length === 0) {
          res.status(404).json({ success: false, message: "Aucun quota trouvé pour l'utilisateur" });
          return;
        }
  
        res.json({ success: true, quota: results[0].quota_utilisateur });
      }
    );
  });
  

/*****************************************************************************************************************************/









// Lancement du serveur
app.listen(port, () => {
    console.log(`Serveur Node.js démarré sur le port ${port}`);
});
