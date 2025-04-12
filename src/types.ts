/**
 * Типы для работы с материалами и кирпичами
 */
// Ключ для доступа к материалу
export type MaterialKey<S = any> = keyof S;

// Шаблон для путей к кирпичам
export type BrickPath = 
  | `${string}.${string}` 
  | `${string}[${number}]` 
  | `${string}[${string}]`;

// Путь к целевому кирпичу
export type TargetPath<T = any> = T extends Record<any, any> ? (keyof T | BrickPath) : string | number;

/**
 * Функции для работы с кирпичами
 */
// Функция обработки кирпича
export type BrickTransform<S = any, V = any, R = any> = (value: V, source: S) => R;

// Функция проверки применимости кирпича
export type BrickCondition<S = any> = (source: S) => boolean;

/**
 * Базовый кирпич - основной строительный блок
 * 
 * @template Source - Тип исходного материала
 * @template Target - Тип целевой структуры
 * @template Value - Тип извлекаемого значения
 * @template Result - Тип результата обработки
 */
export interface Brick<Source = any, Target = any, Value = any, Result = any> {
  /**
   * Источник материала для кирпича
   */
  source?: MaterialKey<Source> | BrickPath | undefined;

  /**
   * Позиция кирпича в целевой структуре
   */
  target: TargetPath<Target>;

  /**
   * Функция обработки кирпича
   */
  transform?: BrickTransform<Source, Value, Result>;

  /**
   * Запасной кирпич, если материал не найден
   */
  fallback?: Result;

  /**
   * Сохранять пустые кирпичи
   */
  preserveNull?: boolean;

  /**
   * Условие использования кирпича
   */
  condition?: BrickCondition<Source>;
}

/**
 * Чертеж - описание структуры
 */
export interface Blueprint<Source = any, Target = any> {
  /**
   * Массив кирпичей для строительства
   */
  bricks: Array<Brick<Source, Target, any, any>>;
}

/**
 * Настройки строительства
 */
export interface Construction<Source = any, Target = any> {
  /**
   * Строгий режим - не пропускать пустые кирпичи
   */
  strict?: boolean;
  
  /**
   * Пропускать пустые кирпичи
   */
  skipUndefined?: boolean;
  
  /**
   * Пропускать дыры в структуре
   */
  skipNull?: boolean;
  
  /**
   * Пропускать дыры в структуре
   */
  skipHoles?: boolean;
  
  /**
   * Инструменты для строительства
   */
  tools?: BrickTool<Source, Target>[];
  
  /**
   * Дополнительные настройки
   */
  [key: string]: unknown;
}

/**
 * Результат строительства
 */
export type BuildResult<T> = T;

/**
 * Рабочее пространство
 */
export interface WorkSpace<Source = any, Target = any> {
  /**
   * Исходный материал
   */
  materials: Source;
  
  /**
   * Чертеж
   */
  blueprint: Blueprint<Source, Target>;
  
  /**
   * Настройки строительства
   */
  construction: Construction<Source, Target>;
  
  /**
   * Текущий обрабатываемый материал
   */
  currentMaterial?: unknown;
  
  /**
   * Текущая позиция в структуре
   */
  currentPosition?: TargetPath<Target>;
  
  /**
   * Дополнительные данные
   */
  [key: string]: unknown;
}

/**
 * Инструмент для работы с кирпичами
 */
export interface BrickTool<Source = any, Target = any> {
  /**
   * Название инструмента
   */
  name: string;
  
  /**
   * Глобальная предобработка
   */
  beforeBuild?: (materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
  
  /**
   * Глобальная постобработка
   */
  afterBuild?: (result: Target, workspace: WorkSpace<Source, Target>) => void;
}

/**
 * Типы для расширения инструментами
 */
// Расширение кирпича дополнительными свойствами
export type ExtendedBrick<Source = any, Target = any, E = Record<string, unknown>> = Brick<Source, Target> & E;

// Расширение рабочего пространства
export type ExtendedWorkSpace<Source = any, Target = any, E = Record<string, unknown>> = WorkSpace<Source, Target> & E; 