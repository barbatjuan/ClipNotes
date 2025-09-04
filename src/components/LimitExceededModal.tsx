import { PaypalSubscribeButton } from './PaypalSubscribeButton';

interface LimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDuration: number;
  remainingMinutes: number;
  planTier: string;
  onUpgrade?: (subscriptionId: string) => void;
}

export const LimitExceededModal: React.FC<LimitExceededModalProps> = ({
  isOpen,
  onClose,
  videoDuration,
  remainingMinutes,
  planTier,
  onUpgrade
}) => {
  if (!isOpen) return null;

  const getUpgradeOptions = () => {
    if (planTier === 'free') {
      return [
        { name: 'Básico', minutes: 60, planId: 'P-33L930430F322933SNCZN4IQ' },
        { name: 'Pro', minutes: 300, planId: 'P-5X541101L03472358NCZN6VY' }
      ];
    } else if (planTier === 'starter') {
      return [
        { name: 'Pro', minutes: 300, planId: 'P-5X541101L03472358NCZN6VY' }
      ];
    }
    return [];
  };

  const upgradeOptions = getUpgradeOptions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900/20 dark:to-warning-800/20 rounded-full -translate-y-16 translate-x-16"></div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 text-xl z-10"
        >
          ×
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-warning-400 to-warning-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-center text-secondary-900 dark:text-white mb-2">
          ¡Oooops! 😅
        </h3>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-secondary-700 dark:text-secondary-300 mb-3">
            Este video dura <span className="font-bold text-warning-600">{videoDuration} minutos</span>, 
            pero solo tienes <span className="font-bold text-primary-600">{remainingMinutes} minutos</span> restantes 
            en tu plan.
          </p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {remainingMinutes === 0 
              ? 'Actualiza tu plan para continuar procesando videos.'
              : 'Busca un video más corto o actualiza tu plan para procesar este.'
            }
          </p>
        </div>

        {/* Upgrade options */}
        {upgradeOptions.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
                💡 Actualiza tu plan y procesa videos más largos
              </h4>
            </div>

            {upgradeOptions.map((option, index) => (
              <div key={index} className="border border-secondary-200 dark:border-secondary-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-bold text-secondary-900 dark:text-white">
                      Plan {option.name}
                    </h5>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {option.minutes} minutos/mes
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      ${option.name === 'Básico' ? '5' : '19'}
                      <span className="text-sm text-secondary-500">/mes</span>
                    </div>
                  </div>
                </div>
                
                {onUpgrade && (
                  <div className="flex justify-center">
                    <PaypalSubscribeButton
                      planId={option.planId}
                      onApprove={onUpgrade}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-700"
          >
            Buscar otro video
          </button>
        </div>
      </div>
    </div>
  );
};
