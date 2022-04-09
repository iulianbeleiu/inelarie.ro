<?php declare(strict_types=1);

namespace Swag\PlatformDemoData\Resources\helper;

use Doctrine\DBAL\Connection;

class TranslationHelper
{
    //Which language to use if no translation for the wanted language is available
    private const DEFAULT_TRANSLATION_LANGUAGE = 'en-GB';

    private DbHelper $dbHelper;

    public function __construct(Connection $connection)
    {
        $this->dbHelper = new DbHelper($connection);
    }

    public function adjustTranslations(array $translations): array
    {
        $systemLanguageCode = $this->dbHelper->getSystemLanguageCode();

        if (!isset($translations[$systemLanguageCode])) {
            $translations[$systemLanguageCode] = $translations[self::DEFAULT_TRANSLATION_LANGUAGE];
        }

        return $this->clearUnavailableTranslations($translations);
    }

    private function clearUnavailableTranslations(array $translations): array
    {
        $availableCodes = [];
        foreach ($translations as $code => $value) {
            $languageId = $this->dbHelper->getLanguageId($code);
            if ($languageId) {
                $availableCodes[$code] = $value;
            }
        }

        return $availableCodes;
    }
}
