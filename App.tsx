import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { useState, useEffect } from 'react';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  initializeAuth,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  UserCredential,
  getReactNativePersistence,
  sendPasswordResetEmail
} from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  QuerySnapshot
} from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// AMBIENTES (ENVIRONMENTS)
// en el ambito laboral se van a encontrar con diferentes stages en producción / deployment

// normalmente hay al menos 2 
// desarrollo, producción
// (pruebas, staging, etc)

// VARIABLES DE AMBIENTE
// ¿por qué usarlas?
// 1. no quiero subir información privilegiada como API keys
// 2. lo más probable es que tengas diferentes datos dependiendo el contexto
// -- api keys
// -- URLs 
// -- cualquier dato de credenciales / validación

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);


// PARA AUTENTICACIÓN PERSISTENTE USA ESTO!
/*
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
*/

const db = getFirestore(app);

onAuthStateChanged(
  auth,
  user => {
    if(user) {
      console.log("USER IS VALIDATED: " + user.email);
    } else {
      console.log("LOGGED OUT");
    }
  }
);

export default function App() {

  const[email, setEmail] = useState("");
  const[password, setPassword] = useState("");
  const[nombre, setNombre] = useState("");
  const[raza, setRaza] = useState("");

  useEffect(() => {
    onSnapshot(
      collection(db, "perritos"),
      querySnapshot => {

        querySnapshot.forEach(documentoActual => {
          console.log(documentoActual.data());
        });
      }
    );
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <TextInput 
        placeholder='email'
        onChangeText={text => {
          setEmail(text);
        }}
      />
      <TextInput 
        placeholder='password'
        secureTextEntry={true}
        onChangeText={text => {
          setPassword(text);
        }}
      />
      <Button 
        title="Registrarme"
        onPress={() => {
          createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential : UserCredential) => {
            // esto va a correr cuando la promesa sea resuelta
            console.log("USUARIO NUEVO REGISTRADO!: " + userCredential.user.email);

          })
          .catch(error => {
            if(error.code == "auth/missing-password")
              alert("PONLE PASSWORD!");

            console.log("ERROR: " + error.message + " " + error.code);
          });

          // OJO MUY IMPORTANTE
          // el código que pongan aquí no va a ejecutarse necesariamente después que lo que viene en el método asíncrono suscrito
        }}
      />
      <Button 
        title="Registrarme sin password"
        onPress={() => {
          // workaround - generar un password
          // al menos 6 caracteres
          // tratar de incluir letras mayúsculas y minúsculas, números y 
          // otros caracteres alfanuméricos 

          // NOTA MUY IMPORTANTE
          // NO DEJEN EL PASSWORD DUMMY, GENEREN UNO
          createUserWithEmailAndPassword(auth, email, "123456")
          .then((userCredential : UserCredential) => {
            // esto va a correr cuando la promesa sea resuelta
            console.log("USUARIO NUEVO REGISTRADO!: " + userCredential.user.email);
            sendPasswordResetEmail(auth, email)
            .then(() => {
              alert("REVISA TU CORREO PARA TERMINAR DE REGISTRARTE!");
            })
            .catch(error => {
              console.error(error);
            });
          })
          .catch(error => {
            if(error.code == "auth/missing-password")
              alert("PONLE PASSWORD!");

            console.log("ERROR: " + error.message + " " + error.code);
          });

          // OJO MUY IMPORTANTE
          // el código que pongan aquí no va a ejecutarse necesariamente después que lo que viene en el método asíncrono suscrito
        }}
      />
      <Button 
        title="Entrar"
        onPress={() =>{
          signInWithEmailAndPassword(auth, email, password)
          .then((userCredential : UserCredential) => {
            console.log("USUARIO VALIDADO!: " + userCredential.user.email);
          })
          .catch(
            error => {
              console.log("ERROR: " + error);
            }
          );
        }}
      />
      <Button 
        title="Salir"
        onPress={() => {
          auth.signOut();
        }}
      />
      <TextInput
        placeholder='nombre'
        onChangeText={text => {
          setNombre(text);
        }}
      />
      <TextInput
        placeholder='raza'
        onChangeText={text => {
          setRaza(text);
        }}
      />

      <Button 
        title='agregar'
        onPress={async() => {
          
          // bloque try-catch
          // código que puede ser riesgoso debe ser corrido en un bloque try catch 
          // la intención es lidiar con excepciones de runtime con la mayor gracia posible

          try {

            var perritosCollection = collection(db, "perritos");

            const newDoc = await addDoc(
              perritosCollection,
              {
                nombre : nombre,
                raza : raza
              }
            );

            console.log("ID DEL NUEVO PERRITO: " + newDoc.id);

          } catch(e) {
            console.log("SI HAY UNA EXCEPCION ESTO CORRE: " + e);
          } finally {
            console.log("ESTO SIEMPRE CORRE!");
          }
        }}
      />
      <Button 
        title='obtener todos'
        onPress={async() => {
          const perritos = collection(db, "perritos");
          var snapshot = await getDocs(perritos);
          snapshot.forEach(currentDocument => {
            console.log(currentDocument.data());
          });
        }}
      />
      <Button 
        title='query'
        onPress={async() => {
          const perritos = collection(db, "perritos");
          const q = query(perritos, where("raza", "==", "Callejero"));
          const snapshot = await getDocs(q);
          snapshot.forEach(currentDocument => {
            console.log(currentDocument.data());
          });
        }}
      />
      <Image 
        source={{uri: "https://www.warrenphotographic.co.uk/photography/sqrs/41644.jpg"}}
        style={{width:100, height:100}}
      />
    </View>



  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
