const supportedLanguages = ['en', 'zh', 'es', 'ru', 'fr'];
const fallbackLanguage = 'en';
const searchParams = new URLSearchParams(window.location.search);
const payload = searchParams.get('payload');
const pairingData = searchParams.get('data');
const openInviteLinks = Array.from(document.querySelectorAll('#open-invite-link'));
const initialConfigLinks = Array.from(document.querySelectorAll('[data-initial-config-link]'));
const inviteCard = document.getElementById('invite-card');
const inviteMessage = document.getElementById('invite-message');
const page = document.body.dataset.page || 'home';
const linkKind = document.body.dataset.linkKind || detectLinkKind(window.location.pathname);
const pagesWithPayloadState = new Set(['invite', 'pair', 'config', 'fallback']);
const maxPayloadLength = 65536;
const maxPairDataLength = 65536;
const payloadTypeToHost = Object.freeze({
  peerlink_account_pairing: 'pair',
  peerlink_invite: 'invite',
  peerlink_server_config: 'config',
});
const legacyTypelessPayloadHost = 'invite';

const strings = {
  en: {
    common: {
      languageAria: 'Language',
      download: 'Download',
      sourceCode: 'Source code',
      openPeerLink: 'Open PeerLink X',
      aboutPeerLink: 'About PeerLink X',
      appRepository: 'PeerLink X app repository',
      serverRepository: 'PeerLink X servers repository',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      comingSoon: 'coming soon',
      privacyPolicy: 'Privacy Policy',
    },
    home: {
      metaTitle: 'PeerLink X Messenger',
      metaDescription: 'PeerLink X is an open-source messenger for private chats, calls, media, and self-hosted communication infrastructure.',
      heroEyebrow: 'Open-source secure messenger',
      lead: 'Private direct and group messaging, calls, media sharing, and self-hosted communication servers.',
      trustTitle: 'Nothing hidden',
      trustBody: 'PeerLink X keeps the app and server code public so anyone can inspect how communication works.',
      initialConfigEyebrow: 'Primary setup',
      initialConfigQrAlt: 'PeerLink X primary server configuration QR code',
      initialConfigTitle: 'Server configuration',
      initialConfigBody: 'Scan this QR code in PeerLink X to import the primary bootstrap, relay, TURN, and push servers.',
      initialConfigButton: 'Open configuration',
      privateTitle: 'Private by design',
      privateBody: 'PeerLink X focuses on peer identity, encrypted messaging, calls, and media without hiding the implementation.',
      selfHostTitle: 'Self-host friendly',
      selfHostBody: 'Run your own bootstrap, relay, and TURN servers when you want control over the infrastructure path.',
      resilientTitle: 'Resilient delivery',
      resilientBody: 'Relay-assisted messages and media help peers reconnect and recover across network changes.',
      aboutTitle: 'About PeerLink X',
      aboutBody: 'PeerLink X is a private open-source messenger for direct chats, group chats, calls, media, and self-hosted network servers.',
      sourceEyebrow: 'Open source',
      sourceTitle: 'Inspect the code yourself',
      sourceBody: 'We do not ask users to trust a black box. The mobile app and server stack are public.',
      downloadEyebrow: 'Download',
      downloadTitle: 'Store links',
      downloadBody: 'App Store and Google Play pages are coming. The buttons are placeholders for now.',
    },
    invite: {
      metaTitle: 'PeerLink X Invite',
      metaDescription: 'Open a PeerLink X invite or learn about the open-source PeerLink X messenger.',
      heroEyebrow: 'PeerLink X invite',
      title: 'Open PeerLink X',
      lead: 'This page opens a PeerLink X invite and also explains what the messenger does.',
      detectedTitle: 'Invite detected',
      openingMessage: 'Opening PeerLink X. If nothing happens, tap the button.',
      invalidMessage: 'This invite link is invalid or too large.',
      missingMessage: 'No invite payload was found in this link.',
      missingButton: 'Go to PeerLink X',
      sourceBody: 'The app and server repositories are public so the communication stack can be inspected.',
    },
    pair: {
      metaTitle: 'PeerLink X Device Pairing',
      metaDescription: 'Open a PeerLink X device pairing link or learn about the open-source PeerLink X messenger.',
      heroEyebrow: 'PeerLink X device pairing',
      title: 'Open PeerLink X',
      lead: 'This page opens a PeerLink X device pairing link and also explains what the messenger does.',
      detectedTitle: 'Pairing link detected',
      openingMessage: 'Opening PeerLink X. If nothing happens, tap the button.',
      invalidMessage: 'This pairing link is invalid or too large.',
      missingMessage: 'No pairing payload was found in this link.',
      missingButton: 'Go to PeerLink X',
      sourceBody: 'The app and server repositories are public so the communication stack can be inspected.',
    },
    config: {
      metaTitle: 'PeerLink X Server Configuration',
      metaDescription: 'Open a PeerLink X server configuration link or learn about the open-source PeerLink X messenger.',
      heroEyebrow: 'PeerLink X server configuration',
      title: 'Open PeerLink X',
      lead: 'This page opens a PeerLink X server configuration link and also explains what the messenger does.',
      detectedTitle: 'Configuration link detected',
      openingMessage: 'Opening PeerLink X. If nothing happens, tap the button.',
      invalidMessage: 'This server configuration link is invalid or too large.',
      missingMessage: 'No server configuration payload was found in this link.',
      missingButton: 'Go to PeerLink X',
      sourceBody: 'The app and server repositories are public so the communication stack can be inspected.',
    },
    fallback: {
      metaTitle: 'PeerLink X',
      metaDescription: 'Open a PeerLink X invite or return to the PeerLink X landing page.',
      eyebrow: 'PeerLink X',
      title: 'Opening invite',
      lead: 'If this was an invite link, PeerLink X will open automatically.',
      checkingTitle: 'Checking link',
      checkingMessage: 'Looking for an invite payload.',
      homeButton: 'Home',
    },
    privacy: {
      metaTitle: 'PeerLink X Privacy Policy',
      metaDescription: 'PeerLink X privacy policy for chats, calls, media, and server configuration sharing.',
      eyebrow: 'Privacy Policy',
      title: 'PeerLink X Privacy Policy',
      effectiveDate: 'Effective date: July 29, 2026',
      intro: 'PeerLink X is an open-source messenger for private chats, calls, media, and self-hosted communication infrastructure. This policy explains what data may be processed and how server configuration information is shared.',
      back: 'Back to PeerLink X',
      dataTitle: 'Data processed',
      dataIdentity: 'Peer identity, account/device identifiers, display names, contacts, and settings stored by the app.',
      dataMessages: 'Chat messages, media metadata, call state, and delivery state needed to provide messaging and calls.',
      dataServers: 'Server configuration such as bootstrap, relay, TURN, and push endpoints that you add, receive, or use.',
      dataTechnical: 'Technical data needed for operation, diagnostics, abuse prevention, and reliability, such as network requests, IP addresses visible to servers, logs, errors, and device/runtime metadata.',
      useTitle: 'How data is used',
      useMessaging: 'To deliver direct and group messages, calls, media transfers, notifications, and account/device features.',
      useReliability: 'To keep communication reliable across network changes, unavailable peers, and relay-assisted delivery.',
      useSafety: 'To diagnose errors, maintain security, prevent abuse, and improve the app and server stack.',
      serverSharingTitle: 'Server Configuration Sharing',
      serverSharingBody: 'To expand the network and improve fault tolerance, information about configuration servers may be transmitted to other users during communication. This can include bootstrap, relay, TURN, and push server endpoints needed to connect, recover delivery, or keep chats and calls working.',
      sharingTitle: 'Data Sharing',
      sharingBody: 'PeerLink X project-operated infrastructure does not sell personal data. Data may be processed by self-hosted servers you choose, by PeerLink X infrastructure endpoints configured in the app, and by service providers used to operate hosting, delivery, diagnostics, or security.',
      retentionTitle: 'Data Retention',
      retentionBody: 'Local app data remains on your device until you delete it or reset the app. Server-side data is kept only as long as needed for delivery, operations, security, troubleshooting, or the service features you use.',
      choicesTitle: 'Your Choices',
      choicesBody: 'You can remove local data in the app settings, choose which servers to use, self-host your own infrastructure, and contact us for privacy or data requests.',
      contactTitle: 'Contact',
      contactBody: 'For privacy questions or data requests, contact us at',
    },
  },
  ru: {
    common: {
      languageAria: 'Язык',
      download: 'Скачать',
      sourceCode: 'Исходный код',
      openPeerLink: 'Открыть PeerLink X',
      aboutPeerLink: 'О PeerLink X',
      appRepository: 'Репозиторий приложения PeerLink X',
      serverRepository: 'Репозиторий серверов PeerLink X',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      comingSoon: 'скоро',
      privacyPolicy: 'Политика конфиденциальности',
    },
    home: {
      metaTitle: 'Мессенджер PeerLink X',
      metaDescription: 'PeerLink X — мессенджер с открытым исходным кодом для приватных чатов, звонков, медиа и собственной коммуникационной инфраструктуры.',
      heroEyebrow: 'Безопасный open-source мессенджер',
      lead: 'Личные и групповые сообщения, звонки, обмен медиа и собственные коммуникационные серверы.',
      trustTitle: 'Ничего не скрываем',
      trustBody: 'Код приложения и серверов PeerLink X открыт, чтобы любой мог проверить, как устроена связь.',
      initialConfigEyebrow: 'Первичная настройка',
      initialConfigQrAlt: 'QR-код первичной конфигурации серверов PeerLink X',
      initialConfigTitle: 'Конфигурация серверов',
      initialConfigBody: 'Отсканируйте QR-код в PeerLink X, чтобы импортировать основные bootstrap, relay, TURN и push-серверы.',
      initialConfigButton: 'Открыть конфигурацию',
      privateTitle: 'Приватность в основе',
      privateBody: 'PeerLink X строится вокруг peer-идентичности, шифрованных сообщений, звонков и медиа без закрытой реализации.',
      selfHostTitle: 'Готов к self-host',
      selfHostBody: 'Можно поднять собственные bootstrap, relay и TURN-серверы, если нужен контроль над инфраструктурой.',
      resilientTitle: 'Устойчивая доставка',
      resilientBody: 'Relay-помощь для сообщений и медиа помогает пирам переподключаться и восстанавливаться после смены сети.',
      aboutTitle: 'О PeerLink X',
      aboutBody: 'PeerLink X — приватный мессенджер с открытым исходным кодом для личных и групповых чатов, звонков, медиа и собственных сетевых серверов.',
      sourceEyebrow: 'Open source',
      sourceTitle: 'Проверь код сам',
      sourceBody: 'Мы не просим доверять черному ящику. Код мобильного приложения и серверной части открыт.',
      downloadEyebrow: 'Скачать',
      downloadTitle: 'Ссылки на магазины',
      downloadBody: 'Страницы App Store и Google Play появятся позже. Пока кнопки работают как заглушки.',
    },
    invite: {
      metaTitle: 'Приглашение PeerLink X',
      metaDescription: 'Откройте приглашение PeerLink X или узнайте больше об open-source приватном мессенджере.',
      heroEyebrow: 'Приглашение PeerLink X',
      title: 'Открыть PeerLink X',
      lead: 'Эта страница открывает приглашение PeerLink X и объясняет, что умеет мессенджер.',
      detectedTitle: 'Приглашение найдено',
      openingMessage: 'Открываем PeerLink X. Если ничего не произошло, нажмите кнопку.',
      invalidMessage: 'Ссылка приглашения некорректна или слишком большая.',
      missingMessage: 'В этой ссылке не найден payload приглашения.',
      missingButton: 'Перейти к PeerLink X',
      sourceBody: 'Репозитории приложения и серверов открыты, чтобы коммуникационный стек можно было проверить.',
    },
    pair: {
      metaTitle: 'Привязка устройства PeerLink X',
      metaDescription: 'Откройте ссылку привязки PeerLink X или узнайте больше об open-source приватном мессенджере.',
      heroEyebrow: 'Привязка устройства PeerLink X',
      title: 'Открыть PeerLink X',
      lead: 'Эта страница открывает ссылку привязки PeerLink X и объясняет, что умеет мессенджер.',
      detectedTitle: 'Ссылка привязки найдена',
      openingMessage: 'Открываем PeerLink X. Если ничего не произошло, нажмите кнопку.',
      invalidMessage: 'Ссылка привязки некорректна или слишком большая.',
      missingMessage: 'В этой ссылке не найден payload привязки.',
      missingButton: 'Перейти к PeerLink X',
      sourceBody: 'Репозитории приложения и серверов открыты, чтобы коммуникационный стек можно было проверить.',
    },
    config: {
      metaTitle: 'Конфигурация серверов PeerLink X',
      metaDescription: 'Откройте ссылку конфигурации серверов PeerLink X или узнайте больше об open-source приватном мессенджере.',
      heroEyebrow: 'Конфигурация серверов PeerLink X',
      title: 'Открыть PeerLink X',
      lead: 'Эта страница открывает ссылку конфигурации серверов PeerLink X и объясняет, что умеет мессенджер.',
      detectedTitle: 'Ссылка конфигурации найдена',
      openingMessage: 'Открываем PeerLink X. Если ничего не произошло, нажмите кнопку.',
      invalidMessage: 'Ссылка конфигурации серверов некорректна или слишком большая.',
      missingMessage: 'В этой ссылке не найден payload конфигурации серверов.',
      missingButton: 'Перейти к PeerLink X',
      sourceBody: 'Репозитории приложения и серверов открыты, чтобы коммуникационный стек можно было проверить.',
    },
    fallback: {
      metaTitle: 'PeerLink X',
      metaDescription: 'Откройте приглашение PeerLink X или вернитесь на главную страницу PeerLink X.',
      eyebrow: 'PeerLink X',
      title: 'Открываем приглашение',
      lead: 'Если это была invite-ссылка, PeerLink X откроется автоматически.',
      checkingTitle: 'Проверяем ссылку',
      checkingMessage: 'Ищем payload приглашения.',
      homeButton: 'Главная',
    },
    privacy: {
      metaTitle: 'Политика конфиденциальности PeerLink X',
      metaDescription: 'Политика конфиденциальности PeerLink X для чатов, звонков, медиа и обмена конфигурацией серверов.',
      eyebrow: 'Политика конфиденциальности',
      title: 'Политика конфиденциальности PeerLink X',
      effectiveDate: 'Дата вступления в силу: 29 июля 2026',
      intro: 'PeerLink X — мессенджер с открытым исходным кодом для приватных чатов, звонков, медиа и собственной коммуникационной инфраструктуры. Эта политика объясняет, какие данные могут обрабатываться и как передается информация о конфигурации серверов.',
      back: 'Назад к PeerLink X',
      dataTitle: 'Какие данные обрабатываются',
      dataIdentity: 'Peer-идентичность, идентификаторы аккаунта и устройств, отображаемые имена, контакты и настройки, сохраненные приложением.',
      dataMessages: 'Сообщения чатов, метаданные медиа, состояние звонков и состояние доставки, необходимые для сообщений и звонков.',
      dataServers: 'Конфигурация серверов: bootstrap, relay, TURN и push endpoint-ы, которые вы добавляете, получаете или используете.',
      dataTechnical: 'Технические данные для работы, диагностики, предотвращения злоупотреблений и надежности: сетевые запросы, IP-адреса, видимые серверам, логи, ошибки и device/runtime metadata.',
      useTitle: 'Как используются данные',
      useMessaging: 'Для доставки личных и групповых сообщений, звонков, медиа, уведомлений и функций аккаунта/устройств.',
      useReliability: 'Чтобы связь оставалась устойчивой при смене сети, недоступности пиров и relay-доставке.',
      useSafety: 'Для диагностики ошибок, поддержки безопасности, предотвращения злоупотреблений и улучшения приложения и серверного стека.',
      serverSharingTitle: 'Передача конфигурации серверов',
      serverSharingBody: 'Для расширения сети и повышения отказоустойчивости информация о серверах конфигурации может передаваться другим пользователям во время общения. Это может включать bootstrap, relay, TURN и push endpoint-ы, необходимые для подключения, восстановления доставки и работы чатов и звонков.',
      sharingTitle: 'Передача данных',
      sharingBody: 'Проектная инфраструктура PeerLink X не продает персональные данные. Данные могут обрабатываться выбранными вами self-hosted серверами, инфраструктурными endpoint-ами PeerLink X, настроенными в приложении, и поставщиками сервисов для хостинга, доставки, диагностики или безопасности.',
      retentionTitle: 'Срок хранения',
      retentionBody: 'Локальные данные приложения остаются на устройстве, пока вы не удалите их или не сбросите приложение. Серверные данные хранятся только столько, сколько нужно для доставки, работы сервиса, безопасности, диагностики или используемых функций.',
      choicesTitle: 'Ваш выбор',
      choicesBody: 'Вы можете удалить локальные данные в настройках приложения, выбрать используемые серверы, поднять собственную инфраструктуру и связаться с нами по вопросам конфиденциальности или данных.',
      contactTitle: 'Контакты',
      contactBody: 'По вопросам конфиденциальности и запросам по данным пишите на',
    },
  },
  es: {
    common: {
      languageAria: 'Idioma',
      download: 'Descargar',
      sourceCode: 'Código fuente',
      openPeerLink: 'Abrir PeerLink X',
      aboutPeerLink: 'Acerca de PeerLink X',
      appRepository: 'Repositorio de la app PeerLink X',
      serverRepository: 'Repositorio de servidores PeerLink X',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      comingSoon: 'próximamente',
      privacyPolicy: 'Política de privacidad',
    },
    home: {
      metaTitle: 'Mensajero PeerLink X',
      metaDescription: 'PeerLink X es un mensajero de código abierto para chats privados, llamadas, multimedia e infraestructura de comunicación autoalojada.',
      heroEyebrow: 'Mensajero seguro de código abierto',
      lead: 'Mensajes directos y grupales, llamadas, multimedia y servidores de comunicación autoalojados.',
      trustTitle: 'Nada oculto',
      trustBody: 'PeerLink X mantiene público el código de la app y los servidores para que cualquiera pueda revisar cómo funciona la comunicación.',
      initialConfigEyebrow: 'Configuración inicial',
      initialConfigQrAlt: 'Código QR de configuración principal de servidores de PeerLink X',
      initialConfigTitle: 'Configuración de servidores',
      initialConfigBody: 'Escanea este código QR en PeerLink X para importar los servidores bootstrap, relay, TURN y push principales.',
      initialConfigButton: 'Abrir configuración',
      privateTitle: 'Privado por diseño',
      privateBody: 'PeerLink X se centra en la identidad peer, mensajes cifrados, llamadas y multimedia sin ocultar la implementación.',
      selfHostTitle: 'Listo para self-host',
      selfHostBody: 'Ejecuta tus propios servidores bootstrap, relay y TURN cuando quieras controlar la ruta de infraestructura.',
      resilientTitle: 'Entrega resistente',
      resilientBody: 'Los mensajes y medios asistidos por relay ayudan a los peers a reconectarse y recuperarse ante cambios de red.',
      aboutTitle: 'Acerca de PeerLink X',
      aboutBody: 'PeerLink X es un mensajero privado de código abierto para chats directos y grupales, llamadas, archivos multimedia y servidores propios.',
      sourceEyebrow: 'Open source',
      sourceTitle: 'Inspecciona el código',
      sourceBody: 'No pedimos confiar en una caja negra. La app móvil y la pila de servidores son públicas.',
      downloadEyebrow: 'Descargar',
      downloadTitle: 'Enlaces de tiendas',
      downloadBody: 'Las páginas de App Store y Google Play llegarán pronto. Por ahora los botones son marcadores.',
    },
    invite: {
      metaTitle: 'Invitación PeerLink X',
      metaDescription: 'Abre una invitación de PeerLink X o conoce el mensajero privado de código abierto.',
      heroEyebrow: 'Invitación PeerLink X',
      title: 'Abrir PeerLink X',
      lead: 'Esta página abre una invitación de PeerLink X y también explica qué hace el mensajero.',
      detectedTitle: 'Invitación detectada',
      openingMessage: 'Abriendo PeerLink X. Si no sucede nada, toca el botón.',
      invalidMessage: 'Este enlace de invitación no es válido o es demasiado grande.',
      missingMessage: 'No se encontró payload de invitación en este enlace.',
      missingButton: 'Ir a PeerLink X',
      sourceBody: 'Los repositorios de la app y los servidores son públicos para poder revisar la pila de comunicación.',
    },
    pair: {
      metaTitle: 'Vinculación de dispositivo PeerLink X',
      metaDescription: 'Abre un enlace de vinculación de PeerLink X o conoce el mensajero privado de código abierto.',
      heroEyebrow: 'Vinculación de dispositivo PeerLink X',
      title: 'Abrir PeerLink X',
      lead: 'Esta página abre un enlace de vinculación de PeerLink X y también explica qué hace el mensajero.',
      detectedTitle: 'Enlace de vinculación detectado',
      openingMessage: 'Abriendo PeerLink X. Si no sucede nada, toca el botón.',
      invalidMessage: 'Este enlace de vinculación no es válido o es demasiado grande.',
      missingMessage: 'No se encontró payload de vinculación en este enlace.',
      missingButton: 'Ir a PeerLink X',
      sourceBody: 'Los repositorios de la app y los servidores son públicos para poder revisar la pila de comunicación.',
    },
    config: {
      metaTitle: 'Configuración de servidores PeerLink X',
      metaDescription: 'Abre un enlace de configuración de servidores de PeerLink X o conoce el mensajero privado de código abierto.',
      heroEyebrow: 'Configuración de servidores PeerLink X',
      title: 'Abrir PeerLink X',
      lead: 'Esta página abre un enlace de configuración de servidores de PeerLink X y también explica qué hace el mensajero.',
      detectedTitle: 'Enlace de configuración detectado',
      openingMessage: 'Abriendo PeerLink X. Si no sucede nada, toca el botón.',
      invalidMessage: 'Este enlace de configuración de servidores no es válido o es demasiado grande.',
      missingMessage: 'No se encontró payload de configuración de servidores en este enlace.',
      missingButton: 'Ir a PeerLink X',
      sourceBody: 'Los repositorios de la app y los servidores son públicos para poder revisar la pila de comunicación.',
    },
    fallback: {
      metaTitle: 'PeerLink X',
      metaDescription: 'Abre una invitación de PeerLink X o vuelve a la página principal.',
      eyebrow: 'PeerLink X',
      title: 'Abriendo invitación',
      lead: 'Si era un enlace de invitación, PeerLink X se abrirá automáticamente.',
      checkingTitle: 'Revisando enlace',
      checkingMessage: 'Buscando el payload de invitación.',
      homeButton: 'Inicio',
    },
    privacy: {
      metaTitle: 'Política de privacidad de PeerLink X',
      metaDescription: 'Política de privacidad de PeerLink X para chats, llamadas, multimedia y uso compartido de configuración de servidores.',
      eyebrow: 'Política de privacidad',
      title: 'Política de privacidad de PeerLink X',
      effectiveDate: 'Fecha de entrada en vigor: 29 de julio de 2026',
      intro: 'PeerLink X es un mensajero de código abierto para chats privados, llamadas, multimedia e infraestructura de comunicación autoalojada. Esta política explica qué datos pueden procesarse y cómo se comparte la información de configuración de servidores.',
      back: 'Volver a PeerLink X',
      dataTitle: 'Datos que procesamos',
      dataIdentity: 'Identidad peer, identificadores de cuenta/dispositivo, nombres visibles, contactos y ajustes almacenados por la app.',
      dataMessages: 'Mensajes de chat, metadatos multimedia, estado de llamadas y estado de entrega necesarios para mensajes y llamadas.',
      dataServers: 'Configuración de servidores como endpoints bootstrap, relay, TURN y push que agregas, recibes o usas.',
      dataTechnical: 'Datos técnicos necesarios para operación, diagnóstico, prevención de abuso y fiabilidad, como solicitudes de red, direcciones IP visibles para servidores, registros, errores y metadatos de dispositivo/runtime.',
      useTitle: 'Cómo usamos los datos',
      useMessaging: 'Para entregar mensajes directos y grupales, llamadas, transferencias multimedia, notificaciones y funciones de cuenta/dispositivo.',
      useReliability: 'Para mantener la comunicación fiable ante cambios de red, peers no disponibles y entrega asistida por relay.',
      useSafety: 'Para diagnosticar errores, mantener la seguridad, prevenir abuso y mejorar la app y la pila de servidores.',
      serverSharingTitle: 'Uso compartido de configuración de servidores',
      serverSharingBody: 'Para ampliar la red y mejorar la tolerancia a fallos, la información sobre servidores de configuración puede transmitirse a otros usuarios durante la comunicación. Esto puede incluir endpoints bootstrap, relay, TURN y push necesarios para conectar, recuperar la entrega o mantener chats y llamadas funcionando.',
      sharingTitle: 'Uso compartido de datos',
      sharingBody: 'No vendemos datos personales. Los datos pueden ser procesados por servidores autoalojados que elijas, por endpoints de infraestructura PeerLink X configurados en la app y por proveedores usados para hosting, entrega, diagnóstico o seguridad.',
      retentionTitle: 'Retención de datos',
      retentionBody: 'Los datos locales de la app permanecen en tu dispositivo hasta que los elimines o restablezcas la app. Los datos del servidor se conservan solo mientras sean necesarios para entrega, operación, seguridad, resolución de problemas o funciones que uses.',
      choicesTitle: 'Tus opciones',
      choicesBody: 'Puedes eliminar datos locales en los ajustes de la app, elegir qué servidores usar, autoalojar tu infraestructura y contactarnos para solicitudes de privacidad o datos.',
      contactTitle: 'Contacto',
      contactBody: 'Para preguntas de privacidad o solicitudes de datos, contáctanos en',
    },
  },
  zh: {
    common: {
      languageAria: '语言',
      download: '下载',
      sourceCode: '源代码',
      openPeerLink: '打开 PeerLink X',
      aboutPeerLink: '关于 PeerLink X',
      appRepository: 'PeerLink X 应用仓库',
      serverRepository: 'PeerLink X 服务器仓库',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      comingSoon: '即将推出',
      privacyPolicy: '隐私政策',
    },
    home: {
      metaTitle: 'PeerLink X 通讯应用',
      metaDescription: 'PeerLink X 是一款开源通讯应用，支持私密聊天、通话、媒体分享和自托管通信基础设施。',
      heroEyebrow: '开源安全通讯应用',
      lead: '私聊、群聊、通话、媒体分享，以及可自托管的通信服务器。',
      trustTitle: '没有隐藏',
      trustBody: 'PeerLink X 公开应用和服务器代码，让任何人都能检查通信方式。',
      initialConfigEyebrow: '初始设置',
      initialConfigQrAlt: 'PeerLink X 主服务器配置二维码',
      initialConfigTitle: '服务器配置',
      initialConfigBody: '在 PeerLink X 中扫描此二维码，导入主要 bootstrap、relay、TURN 和 push 服务器。',
      initialConfigButton: '打开配置',
      privateTitle: '以隐私为核心',
      privateBody: 'PeerLink X 专注于 peer 身份、加密消息、通话和媒体，并公开实现细节。',
      selfHostTitle: '适合自托管',
      selfHostBody: '当你需要控制基础设施路径时，可以运行自己的 bootstrap、relay 和 TURN 服务器。',
      resilientTitle: '可靠投递',
      resilientBody: 'relay 辅助的消息和媒体可帮助 peer 在网络变化后重新连接和恢复。',
      aboutTitle: '关于 PeerLink X',
      aboutBody: 'PeerLink X 是一款开源隐私通讯应用，支持私聊、群聊、通话、媒体分享以及自托管网络服务器。',
      sourceEyebrow: '开源',
      sourceTitle: '自己查看代码',
      sourceBody: '我们不要求用户信任黑盒。移动应用和服务器栈都是公开的。',
      downloadEyebrow: '下载',
      downloadTitle: '应用商店链接',
      downloadBody: 'App Store 和 Google Play 页面即将推出。当前按钮暂为占位。',
    },
    invite: {
      metaTitle: 'PeerLink X 邀请',
      metaDescription: '打开 PeerLink X 邀请，或了解这款开源隐私通讯应用。',
      heroEyebrow: 'PeerLink X 邀请',
      title: '打开 PeerLink X',
      lead: '此页面会打开 PeerLink X 邀请，并说明这款通讯应用的用途。',
      detectedTitle: '检测到邀请',
      openingMessage: '正在打开 PeerLink X。如果没有反应，请点击按钮。',
      invalidMessage: '此邀请链接无效或过大。',
      missingMessage: '此链接中没有找到邀请 payload。',
      missingButton: '前往 PeerLink X',
      sourceBody: '应用和服务器仓库都是公开的，因此可以检查整个通信栈。',
    },
    pair: {
      metaTitle: 'PeerLink X 设备绑定',
      metaDescription: '打开 PeerLink X 设备绑定链接，或了解这款开源隐私通讯应用。',
      heroEyebrow: 'PeerLink X 设备绑定',
      title: '打开 PeerLink X',
      lead: '此页面会打开 PeerLink X 设备绑定链接，并说明这款通讯应用的用途。',
      detectedTitle: '检测到绑定链接',
      openingMessage: '正在打开 PeerLink X。如果没有反应，请点击按钮。',
      invalidMessage: '此绑定链接无效或过大。',
      missingMessage: '此链接中没有找到绑定 payload。',
      missingButton: '前往 PeerLink X',
      sourceBody: '应用和服务器仓库都是公开的，因此可以检查整个通信栈。',
    },
    config: {
      metaTitle: 'PeerLink X 服务器配置',
      metaDescription: '打开 PeerLink X 服务器配置链接，或了解这款开源隐私通讯应用。',
      heroEyebrow: 'PeerLink X 服务器配置',
      title: '打开 PeerLink X',
      lead: '此页面会打开 PeerLink X 服务器配置链接，并说明这款通讯应用的用途。',
      detectedTitle: '检测到配置链接',
      openingMessage: '正在打开 PeerLink X。如果没有反应，请点击按钮。',
      invalidMessage: '此服务器配置链接无效或过大。',
      missingMessage: '此链接中没有找到服务器配置 payload。',
      missingButton: '前往 PeerLink X',
      sourceBody: '应用和服务器仓库都是公开的，因此可以检查整个通信栈。',
    },
    fallback: {
      metaTitle: 'PeerLink X',
      metaDescription: '打开 PeerLink X 邀请或返回 PeerLink X 主页。',
      eyebrow: 'PeerLink X',
      title: '正在打开邀请',
      lead: '如果这是邀请链接，PeerLink X 会自动打开。',
      checkingTitle: '正在检查链接',
      checkingMessage: '正在查找邀请 payload。',
      homeButton: '主页',
    },
    privacy: {
      metaTitle: 'PeerLink X 隐私政策',
      metaDescription: 'PeerLink X 关于聊天、通话、媒体和服务器配置共享的隐私政策。',
      eyebrow: '隐私政策',
      title: 'PeerLink X 隐私政策',
      effectiveDate: '生效日期：2026 年 7 月 29 日',
      intro: 'PeerLink X 是一款开源通讯应用，支持私密聊天、通话、媒体分享和自托管通信基础设施。本政策说明可能处理哪些数据，以及服务器配置信息如何共享。',
      back: '返回 PeerLink X',
      dataTitle: '被处理的数据',
      dataIdentity: '应用存储的 peer 身份、账号/设备标识符、显示名称、联系人和设置。',
      dataMessages: '为提供消息和通话所需的聊天消息、媒体元数据、通话状态和投递状态。',
      dataServers: '你添加、接收或使用的服务器配置，例如 bootstrap、relay、TURN 和 push endpoint。',
      dataTechnical: '运行、诊断、防滥用和可靠性所需的技术数据，例如网络请求、服务器可见的 IP 地址、日志、错误以及设备/runtime 元数据。',
      useTitle: '数据如何被使用',
      useMessaging: '用于投递私聊和群聊消息、通话、媒体传输、通知以及账号/设备功能。',
      useReliability: '用于在网络变化、peer 不可用和 relay 辅助投递场景下保持通信可靠。',
      useSafety: '用于诊断错误、维护安全、防止滥用并改进应用和服务器栈。',
      serverSharingTitle: '服务器配置共享',
      serverSharingBody: '为扩展网络并提升容错能力，配置服务器的信息可能会在通信过程中传输给其他用户。这可能包括连接、恢复投递或保持聊天和通话工作所需的 bootstrap、relay、TURN 和 push server endpoint。',
      sharingTitle: '数据共享',
      sharingBody: 'PeerLink X 项目运营的基础设施不出售个人数据。数据可能由你选择的自托管服务器、应用中配置的 PeerLink X 基础设施 endpoint，以及用于托管、投递、诊断或安全的服务提供商处理。',
      retentionTitle: '数据保留',
      retentionBody: '本地应用数据会保留在你的设备上，直到你删除或重置应用。服务器端数据仅在投递、运营、安全、故障排查或你使用的服务功能所需期间保留。',
      choicesTitle: '你的选择',
      choicesBody: '你可以在应用设置中移除本地数据，选择使用哪些服务器，自托管自己的基础设施，并联系我们处理隐私或数据请求。',
      contactTitle: '联系',
      contactBody: '如有隐私问题或数据请求，请联系',
    },
  },
  fr: {
    common: {
      languageAria: 'Langue',
      download: 'Télécharger',
      sourceCode: 'Code source',
      openPeerLink: 'Ouvrir PeerLink X',
      aboutPeerLink: 'À propos de PeerLink X',
      appRepository: 'Dépôt de l’app PeerLink X',
      serverRepository: 'Dépôt des serveurs PeerLink X',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      comingSoon: 'bientôt',
      privacyPolicy: 'Politique de confidentialité',
    },
    home: {
      metaTitle: 'Messagerie PeerLink X',
      metaDescription: 'PeerLink X est une messagerie open source pour les discussions privées, les appels, les médias et l’infrastructure auto-hébergée.',
      heroEyebrow: 'Messagerie sécurisée open source',
      lead: 'Messages directs et de groupe, appels, partage de médias et serveurs de communication auto-hébergés.',
      trustTitle: 'Rien de caché',
      trustBody: 'PeerLink X garde le code de l’app et des serveurs public afin que chacun puisse inspecter le fonctionnement des communications.',
      initialConfigEyebrow: 'Configuration initiale',
      initialConfigQrAlt: 'QR code de configuration principale des serveurs PeerLink X',
      initialConfigTitle: 'Configuration des serveurs',
      initialConfigBody: 'Scannez ce QR code dans PeerLink X pour importer les serveurs bootstrap, relay, TURN et push principaux.',
      initialConfigButton: 'Ouvrir la configuration',
      privateTitle: 'Privé par conception',
      privateBody: 'PeerLink X met l’accent sur l’identité peer, les messages chiffrés, les appels et les médias sans cacher l’implémentation.',
      selfHostTitle: 'Pensé pour le self-host',
      selfHostBody: 'Lance tes propres serveurs bootstrap, relay et TURN lorsque tu veux contrôler le chemin d’infrastructure.',
      resilientTitle: 'Livraison robuste',
      resilientBody: 'Les messages et médias assistés par relay aident les peers à se reconnecter et récupérer lors des changements réseau.',
      aboutTitle: 'À propos de PeerLink X',
      aboutBody: 'PeerLink X est une messagerie privée open source pour les discussions directes et de groupe, les appels, les médias et les serveurs auto-hébergés.',
      sourceEyebrow: 'Open source',
      sourceTitle: 'Inspecter le code',
      sourceBody: 'Nous ne demandons pas de faire confiance à une boîte noire. L’app mobile et la pile serveur sont publiques.',
      downloadEyebrow: 'Télécharger',
      downloadTitle: 'Liens des stores',
      downloadBody: 'Les pages App Store et Google Play arrivent. Pour l’instant, les boutons sont des placeholders.',
    },
    invite: {
      metaTitle: 'Invitation PeerLink X',
      metaDescription: 'Ouvrez une invitation PeerLink X ou découvrez la messagerie privée open source.',
      heroEyebrow: 'Invitation PeerLink X',
      title: 'Ouvrir PeerLink X',
      lead: 'Cette page ouvre une invitation PeerLink X et explique aussi ce que fait la messagerie.',
      detectedTitle: 'Invitation détectée',
      openingMessage: 'Ouverture de PeerLink X. Si rien ne se passe, touchez le bouton.',
      invalidMessage: 'Ce lien d’invitation est invalide ou trop volumineux.',
      missingMessage: 'Aucun payload d’invitation n’a été trouvé dans ce lien.',
      missingButton: 'Aller à PeerLink X',
      sourceBody: 'Les dépôts de l’app et des serveurs sont publics afin que la pile de communication puisse être inspectée.',
    },
    pair: {
      metaTitle: 'Association d’appareil PeerLink X',
      metaDescription: 'Ouvrez un lien d’association PeerLink X ou découvrez la messagerie privée open source.',
      heroEyebrow: 'Association d’appareil PeerLink X',
      title: 'Ouvrir PeerLink X',
      lead: 'Cette page ouvre un lien d’association PeerLink X et explique aussi ce que fait la messagerie.',
      detectedTitle: 'Lien d’association détecté',
      openingMessage: 'Ouverture de PeerLink X. Si rien ne se passe, touchez le bouton.',
      invalidMessage: 'Ce lien d’association est invalide ou trop volumineux.',
      missingMessage: 'Aucun payload d’association n’a été trouvé dans ce lien.',
      missingButton: 'Aller à PeerLink X',
      sourceBody: 'Les dépôts de l’app et des serveurs sont publics afin que la pile de communication puisse être inspectée.',
    },
    config: {
      metaTitle: 'Configuration des serveurs PeerLink X',
      metaDescription: 'Ouvrez un lien de configuration des serveurs PeerLink X ou découvrez la messagerie privée open source.',
      heroEyebrow: 'Configuration des serveurs PeerLink X',
      title: 'Ouvrir PeerLink X',
      lead: 'Cette page ouvre un lien de configuration des serveurs PeerLink X et explique aussi ce que fait la messagerie.',
      detectedTitle: 'Lien de configuration détecté',
      openingMessage: 'Ouverture de PeerLink X. Si rien ne se passe, touchez le bouton.',
      invalidMessage: 'Ce lien de configuration des serveurs est invalide ou trop volumineux.',
      missingMessage: 'Aucun payload de configuration des serveurs n’a été trouvé dans ce lien.',
      missingButton: 'Aller à PeerLink X',
      sourceBody: 'Les dépôts de l’app et des serveurs sont publics afin que la pile de communication puisse être inspectée.',
    },
    fallback: {
      metaTitle: 'PeerLink X',
      metaDescription: 'Ouvrez une invitation PeerLink X ou revenez à la page d’accueil PeerLink X.',
      eyebrow: 'PeerLink X',
      title: 'Ouverture de l’invitation',
      lead: 'Si c’était un lien d’invitation, PeerLink X s’ouvrira automatiquement.',
      checkingTitle: 'Vérification du lien',
      checkingMessage: 'Recherche du payload d’invitation.',
      homeButton: 'Accueil',
    },
    privacy: {
      metaTitle: 'Politique de confidentialité PeerLink X',
      metaDescription: 'Politique de confidentialité PeerLink X pour les chats, appels, médias et le partage de configuration des serveurs.',
      eyebrow: 'Politique de confidentialité',
      title: 'Politique de confidentialité PeerLink X',
      effectiveDate: 'Date d’effet : 29 juillet 2026',
      intro: 'PeerLink X est une messagerie open source pour les discussions privées, les appels, les médias et l’infrastructure de communication auto-hébergée. Cette politique explique quelles données peuvent être traitées et comment les informations de configuration des serveurs sont partagées.',
      back: 'Retour à PeerLink X',
      dataTitle: 'Données que nous traitons',
      dataIdentity: 'Identité peer, identifiants de compte/appareil, noms d’affichage, contacts et paramètres stockés par l’app.',
      dataMessages: 'Messages de chat, métadonnées média, état des appels et état de livraison nécessaires à la messagerie et aux appels.',
      dataServers: 'Configuration des serveurs comme les endpoints bootstrap, relay, TURN et push que vous ajoutez, recevez ou utilisez.',
      dataTechnical: 'Données techniques nécessaires au fonctionnement, au diagnostic, à la prévention des abus et à la fiabilité, comme les requêtes réseau, adresses IP visibles par les serveurs, journaux, erreurs et métadonnées device/runtime.',
      useTitle: 'Comment nous utilisons les données',
      useMessaging: 'Pour livrer les messages directs et de groupe, les appels, les transferts média, les notifications et les fonctions de compte/appareil.',
      useReliability: 'Pour maintenir des communications fiables lors des changements réseau, des peers indisponibles et de la livraison assistée par relay.',
      useSafety: 'Pour diagnostiquer les erreurs, maintenir la sécurité, prévenir les abus et améliorer l’app et la pile serveur.',
      serverSharingTitle: 'Partage de configuration des serveurs',
      serverSharingBody: 'Pour étendre le réseau et améliorer la tolérance aux pannes, les informations sur les serveurs de configuration peuvent être transmises à d’autres utilisateurs pendant la communication. Cela peut inclure les endpoints bootstrap, relay, TURN et push nécessaires pour se connecter, récupérer la livraison ou maintenir les chats et appels fonctionnels.',
      sharingTitle: 'Partage des données',
      sharingBody: 'L’infrastructure opérée par le projet PeerLink X ne vend pas de données personnelles. Les données peuvent être traitées par les serveurs auto-hébergés que vous choisissez, par les endpoints d’infrastructure PeerLink X configurés dans l’app et par des fournisseurs utilisés pour l’hébergement, la livraison, le diagnostic ou la sécurité.',
      retentionTitle: 'Conservation des données',
      retentionBody: 'Les données locales de l’app restent sur votre appareil jusqu’à leur suppression ou la réinitialisation de l’app. Les données côté serveur sont conservées uniquement le temps nécessaire à la livraison, aux opérations, à la sécurité, au dépannage ou aux fonctions utilisées.',
      choicesTitle: 'Vos choix',
      choicesBody: 'Vous pouvez supprimer les données locales dans les paramètres de l’app, choisir les serveurs à utiliser, auto-héberger votre propre infrastructure et nous contacter pour les demandes de confidentialité ou de données.',
      contactTitle: 'Contact',
      contactBody: 'Pour les questions de confidentialité ou demandes de données, contactez-nous à',
    },
  },
};

function readKey(language, key) {
  return key.split('.').reduce((value, part) => value?.[part], strings[language]);
}

function translate(key, language) {
  return readKey(language, key) ?? readKey(fallbackLanguage, key) ?? key;
}

function normalizeLanguage(language) {
  const shortCode = (language || '').slice(0, 2).toLowerCase();
  return supportedLanguages.includes(shortCode) ? shortCode : fallbackLanguage;
}

function preferredLanguage() {
  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  if (queryLanguage) {
    return normalizeLanguage(queryLanguage);
  }
  const savedLanguage = readSavedLanguage();
  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }
  return normalizeLanguage(window.navigator.language);
}

function readSavedLanguage() {
  try {
    return window.localStorage.getItem('peerlink.site.language');
  } catch (_) {
    return null;
  }
}

function saveLanguage(language) {
  try {
    window.localStorage.setItem('peerlink.site.language', language);
  } catch (_) {
    // Some browsers block storage for static pages; language switching must still work.
  }
}

function setMeta(name, content) {
  const node = document.querySelector(`meta[name="${name}"]`);
  if (node) {
    node.setAttribute('content', content);
  }
}

function setOpenGraph(property, content) {
  const node = document.querySelector(`meta[property="${property}"]`);
  if (node) {
    node.setAttribute('content', content);
  }
}

function applyLanguage(language) {
  const activeLanguage = normalizeLanguage(language);
  document.documentElement.lang = activeLanguage;
  saveLanguage(activeLanguage);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = translate(node.dataset.i18n, activeLanguage);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    node.dataset.i18nAttr.split(',').forEach((entry) => {
      const [attribute, key] = entry.split(':').map((value) => value.trim());
      if (attribute && key) {
        node.setAttribute(attribute, translate(key, activeLanguage));
      }
    });
  });

  document.querySelectorAll('[data-current-lang]').forEach((node) => {
    node.textContent = activeLanguage.toUpperCase();
  });


  document.querySelectorAll('[data-lang]').forEach((button) => {
    const isActive = button.dataset.lang === activeLanguage;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const titleKey = `${page}.metaTitle`;
  const descriptionKey = `${page}.metaDescription`;
  const title = translate(titleKey, activeLanguage);
  const description = translate(descriptionKey, activeLanguage);
  document.title = title;
  setMeta('description', description);
  setOpenGraph('og:title', title);
  setOpenGraph('og:description', description);
}

function showLinkMissing() {
  if (inviteMessage) {
    inviteMessage.dataset.i18n = `${page}.missingMessage`;
  }
  openInviteLinks.forEach((link) => {
    link.href = '/';
    link.dataset.i18n = `${page}.missingButton`;
  });
}

function showLinkInvalid() {
  if (inviteMessage) {
    inviteMessage.dataset.i18n = `${page}.invalidMessage`;
  }
  openInviteLinks.forEach((link) => {
    link.href = '/';
    link.dataset.i18n = `${page}.missingButton`;
  });
}

function configureOpenLink() {
  const appLink = resolveOpenLink();
  if (appLink === false) {
    showLinkInvalid();
    return;
  }
  if (appLink) {
    showResolvedLink(appLink);
    return;
  }

  if (pagesWithPayloadState.has(page)) {
    showLinkMissing();
    return;
  }

  openInviteLinks.forEach((link) => {
    link.hidden = true;
  });
}

function showResolvedLink(appLink) {
  if (inviteCard) {
    inviteCard.hidden = false;
  }
  openInviteLinks.forEach((link) => {
    link.href = appLink;
  });
  window.setTimeout(() => {
    window.location.href = appLink;
  }, 350);
}

function resolveOpenLink() {
  if (linkKind === 'pair' && pairingData) {
    if (pairingData.length > maxPairDataLength) {
      return false;
    }
    return `peerlink://pair?data=${encodeURIComponent(pairingData)}`;
  }
  if (!payload) {
    return null;
  }
  if (payload.length > maxPayloadLength) {
    return false;
  }
  if (linkKind === 'pair') {
    return buildAppLinkFromPayload(payload);
  }
  return buildAppLinkFromPayload(payload);
}

function buildAppLinkFromPayload(rawPayload) {
  const encodedPayload = encodeURIComponent(rawPayload);
  const payloadInfo = inspectPayload(rawPayload);
  if (!payloadInfo.valid) {
    return false;
  }
  const payloadType = payloadInfo.type;
  if (payloadType && !payloadTypeToHost[payloadType]) {
    return false;
  }
  if (linkKind === 'config' && payloadType !== 'peerlink_server_config') {
    return false;
  }
  if (linkKind === 'invite' && payloadType === 'peerlink_server_config') {
    return false;
  }
  const targetHost = payloadTypeToHost[payloadType] ?? (linkKind === 'pair' ? 'pair' : legacyTypelessPayloadHost);
  return `peerlink://${targetHost}?payload=${encodedPayload}`;
}

function inspectPayload(rawPayload) {
  try {
    const normalized = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded));
    return {
      valid: true,
      type: typeof parsed?.type === 'string' ? parsed.type : null,
    };
  } catch (_) {
    return {
      valid: false,
      type: null,
    };
  }
}

function detectLinkKind(pathname) {
  if (pathname.includes('/pair')) {
    return 'pair';
  }
  if (pathname.includes('/config')) {
    return 'config';
  }
  return 'invite';
}

async function configureInitialConfigLinks() {
  if (!initialConfigLinks.length) {
    return;
  }
  try {
    const response = await fetch('/config/initial-server-config.generated.json', {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('initial config metadata unavailable');
    }
    const generated = await response.json();
    if (typeof generated?.url !== 'string' || !generated.url.startsWith('https://simplegear.org/config?payload=')) {
      throw new Error('initial config metadata malformed');
    }
    initialConfigLinks.forEach((link) => {
      link.href = generated.url.replace('https://simplegear.org', '');
    });
  } catch (_) {
    initialConfigLinks.forEach((link) => {
      link.href = '/config/';
    });
  }
}

document.querySelectorAll('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => {
    applyLanguage(button.dataset.lang);
  });
});

configureInitialConfigLinks();
configureOpenLink();
applyLanguage(preferredLanguage());
