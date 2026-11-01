import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';

@Injectable()
export class BucketService implements OnModuleInit, OnModuleDestroy {
  private bucket: FirebaseStorage;
  protected app: FirebaseApp;

  /**
   * Inicializa o storage quando as configurações mínimas estiverem disponíveis.
   * A ausência do Firebase não impede testar os fluxos que não enviam imagens.
   */
  onModuleInit() {
    const configuration = {
      apiKey: process.env.FIREBASE_API_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
    if (
      !configuration.apiKey?.trim() ||
      !configuration.projectId?.trim() ||
      !configuration.storageBucket?.trim()
    ) {
      return;
    }
    this.app = initializeApp(configuration);
    this.bucket = getStorage(this.app);
  }

  /** Encerra somente a instância Firebase que este serviço inicializou. */
  async onModuleDestroy() {
    this.bucket = null;
    if (this.app) {
      const app = this.app;
      this.app = null;
      await deleteApp(app);
    }
  }

  /**
   * Obtém o storage disponível, sem expor configurações ou credenciais na resposta.
   * @throws {ServiceUnavailableException} Se o Firebase ainda não foi configurado.
   */
  getBucket() {
    if (!this.bucket) {
      throw new ServiceUnavailableException(
        'Upload de imagens indisponível. Configure o Firebase Storage no servidor.'
      );
    }
    return this.bucket;
  }
}
