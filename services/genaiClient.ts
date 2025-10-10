/**
 * Servicio minimalista para solicitar resúmenes estructurados a Gemini.
 * Lo usamos para evitar depender de paquetes bloqueados en la red escolar
 * y poder inyectar un `fetch` simulado en las pruebas.
 */
export interface GenerateSummaryOptions {
  /** API key de Gemini. Viene de VITE_GEMINI_API_KEY. */
  apiKey?: string;
  /** Permite inyectar un fetch simulado (útil en Vitest). */
  fetcher?: typeof fetch;
}

export interface GenerateSummaryPayload {
  title: string;
  summary: string;
  /** Texto crudo devuelto por la API (útil para depurar en clase). */
  rawText?: string;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export class GuardianGenAIClient {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(options: GenerateSummaryOptions = {}) {
    this.apiKey = options.apiKey?.trim() ?? '';
    this.fetcher = options.fetcher ?? fetch;
  }

  /**
   * Genera un título y resumen breve para el reporte del Ángel Guardián.
   * Valida entrada vacía y entrega mensajes pensados para estudiantes.
   */
  async generateStructuredSummary(
    transcript: string,
    requestOptions: { signal?: AbortSignal } = {}
  ): Promise<GenerateSummaryPayload> {
    const trimmed = transcript.trim();
    if (!trimmed) {
      throw new Error('Necesitamos texto antes de pedir ayuda a la IA. Repite la grabación.');
    }

    if (!this.apiKey) {
      throw new Error('Falta la API key de Gemini. Configura VITE_GEMINI_API_KEY en tu .env.');
    }

    const response = await this.fetcher(
      `${GEMINI_ENDPOINT}?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        signal: requestOptions.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.buildRequestBody(trimmed))
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini respondió ${response.status}. Revisa la clave o inténtalo más tarde.`);
    }

    const data = await response.json();
    const rawText = this.extractText(data);

    try {
      const parsed = JSON.parse(rawText) as GenerateSummaryPayload;
      if (!parsed.title || !parsed.summary) {
        throw new Error('Respuesta incompleta de Gemini.');
      }
      return { ...parsed, rawText };
    } catch (error) {
      throw new Error('Gemini envió un formato inesperado. Pide otro intento o ajusta el prompt.');
    }
  }

  private buildRequestBody(transcript: string) {
    const prompt = [
      'Lee la transcripción de un incidente escolar y redacta un reporte objetivo en español.',
      'Devuelve un objeto JSON con las propiedades "title" y "summary".',
      'El resumen debe centrarse en hechos observables y sugerir próximos pasos breves.'
    ].join(' ');

    return {
      contents: [
        {
          parts: [
            {
              text: `${prompt}\n\nTRANSCRIPCIÓN:\n"${transcript}"`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' }
          },
          required: ['title', 'summary']
        }
      }
    };
  }

  private extractText(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }

    if (
      data &&
      typeof data === 'object' &&
      'candidates' in data &&
      Array.isArray((data as any).candidates)
    ) {
      const candidate = (data as any).candidates[0];
      const partText = candidate?.content?.parts?.[0]?.text;
      if (typeof partText === 'string') {
        return partText;
      }
    }

    throw new Error('No se pudo interpretar la respuesta de Gemini.');
  }
}
