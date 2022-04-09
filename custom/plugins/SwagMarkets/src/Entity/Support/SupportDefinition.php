<?php declare(strict_types=1);

namespace Swag\Markets\Entity\Support;

use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;

class SupportDefinition extends EntityDefinition
{
    /**
     * @var string
     */
    public const ENTITY_NAME = 'bf_support';

    /**
     * @return string
     */
    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    /**
     * @return string
     */
    public function getEntityClass(): string
    {
        return SupportEntity::class;
    }

    /**
     * @return FieldCollection
     */
    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new StringField('salutationId', 'salutationId'))->addFlags(new Required()),
                (new StringField('name', 'name'))->addFlags(new Required()),
                (new StringField('company', 'company'))->addFlags(new Required()),
                (new StringField('email', 'email'))->addFlags(new Required()),
                (new StringField('phoneNumber', 'phoneNumber')),
                (new StringField('message', 'message')),
            ]
        );
    }
}
