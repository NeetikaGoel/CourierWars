courier-war/ // this is for the full Courier War project root

  frontend/ // this is for browser client code using TypeScript, Phaser, HTML, and CSS

    public/ // this is for static files served directly by frontend dev server
      index.html // this is for the root HTML page where the app and Phaser canvas mount
      favicon.ico // this is for browser tab icon

    src/ // this is for all frontend source code

      main.ts // this is for bootstrapping the frontend app and loading the first screen

      app/ // this is for app-level startup and screen navigation
        AppBootstrap.ts // this is for checking auth/profile on app start and deciding first screen
        AppRouter.ts // this is for switching between landing, auth, setup, game, and result screens
        AppScreenName.ts // this is for fixed screen name constants used by the router
        AppDomMount.ts // this is for mounting and unmounting DOM screens
        AppErrorBoundary.ts // this is for showing safe fallback UI if frontend screen rendering fails


      config/ // this is for frontend-wide configuration not specific to Phaser map internals
        FrontendApiConfig.ts // this is for API base URL, timeout values, and fetch credentials setting
        FrontendAuthConfig.ts // this is for JWT cookie auth behavior, CSRF header name, and refresh settings
        FrontendPollingConfig.ts // this is for lobby, active match, ended match, and inactive-tab polling intervals
        FrontendRouteConfig.ts // this is for allowed screen transitions and default screen rules

      api/ // this is for all frontend API wrappers
        ApiClient.ts // this is for common fetch wrapper, credentials include, JSON parsing, and response envelope handling
        ApiError.ts // this is for frontend API error class and safe API error creation
        ApiResponseType.ts // this is for common success/error response envelope types
        AuthApi.ts // this is for register, login, guest, refresh, logout, and guest forget API calls
        ProfileApi.ts // this is for fetching current user profile and stats
        MapApi.ts // this is for fetching current map metadata and generated match map snapshot
        MatchApi.ts // this is for create/auto-join match, start match, poll state, and fetch result
        CourierActionApi.ts // this is for Courier move and Courier ability API calls
        SaboteurActionApi.ts // this is for Saboteur hurdle activation API calls

      apiTypes/ // this is for request and response types for frontend API contracts
        AuthApiType.ts // this is for auth request and response TypeScript shapes
        ProfileApiType.ts // this is for profile response and stats response shapes
        MapApiType.ts // this is for map metadata and backend-generated map payload shapes
        MatchApiType.ts // this is for match create, match state, match map, and result response shapes
        CourierActionApiType.ts // this is for Courier movement and ability request/response shapes
        SaboteurActionApiType.ts // this is for Saboteur hurdle request/response shapes
        ApiErrorCodeType.ts // this is for stable API error code constants used by frontend

      state/ // this is for frontend state outside Phaser rendering
        AuthSessionState.ts // this is for current user, guest flag, CSRF token, and auth status
        ProfileState.ts // this is for loaded profile stats and derived stats shown in UI
        MatchSetupState.ts // this is for selected difficulty, role preference, and setup form state
        MatchRuntimeState.ts // this is for latest server match state received by polling
        MatchPollingController.ts // this is for polling match state using known stateVersion
        ClientActionIdFactory.ts // this is for creating clientActionId and Idempotency-Key values
        AuthRefreshController.ts // this is for calling /auth/refresh when access token expires
        BrowserPreferenceState.ts // this is for non-sensitive saved values like remembered email
        FrontendStateStore.ts // this is for simple shared frontend state between screens

      screens/ // this is for DOM-based screens outside Phaser map rendering
        ScreenBase.ts // this is for shared mount, unmount, and cleanup behavior for screens
        LandingScreen.ts // this is for title page with Login, Register, and Continue as Guest
        LoginScreen.ts // this is for registered user login form and email autocomplete
        RegisterScreen.ts // this is for username, email, password, display name, and preferred role form
        GuestEntryScreen.ts // this is for guest display name and Continue as Guest action
        HomeSetupScreen.ts // this is for difficulty selection, role preference, stats preview, and start matchmaking
        GameShellScreen.ts // this is for holding Phaser canvas and game HUD container during a match
        ResultScreen.ts // this is for winner, reason, time, lives, hurdle counts, ability counts, and play again
        ScreenStyle.ts // this is for shared screen CSS class names or simple style constants

      ui/ // this is for reusable simple UI components
        ButtonComponent.ts // this is for creating standard buttons
        FormFieldComponent.ts // this is for creating labelled inputs with validation errors
        LoadingComponent.ts // this is for loading indicators while APIs run
        ErrorMessageComponent.ts // this is for showing API errors and validation errors
        StatsSummaryComponent.ts // this is for rendering user stats on setup and result screens
        DifficultySelectorComponent.ts // this is for Easy, Normal, Hard selection UI
        RolePreferenceSelectorComponent.ts // this is for Courier, Saboteur, Any role preference UI
        ResultSummaryComponent.ts // this is for rendering final match summary details
        HudPanelComponent.ts // this is for shared role-specific HUD panel layout if DOM HUD is used

      styles/ // this is for frontend CSS files
        global.css // this is for global page, body, font, and layout styles
        screens.css // this is for landing, login, register, guest, setup, and result screen styles
        game-shell.css // this is for Phaser canvas area and right-side HUD layout
        forms.css // this is for shared form and input styling

      game/ // this is for Phaser game code

        v7/ // this is for Courier War V7 map, rendering, input, and Phaser scene code

          config/ // this is for Phaser, map, movement, camera, hurdle, asset, and debug config
            PhaserGameConfig.ts // this is for Phaser scene key, canvas parent id, fallback canvas size, and background color
            CityMapGenerationConfig.ts // this is for local prototype map generation config and backend map payload compatibility checks
            CityMapVisualConfig.ts // this is for tile geometry, terrain colors, road colors, feature colors, marker colors, overlays, and depths
            CourierMovementConfig.ts // this is for movement duration, movement costs, slowdowns, and held-arrow behavior
            MapCameraConfig.ts // this is for camera zoom, drag, pan, zone focus, and world padding
            SaboteurHurdleConfig.ts // this is for client-side display of hurdle duration, cooldown, energy cost, and placement labels
            MapAssetDisplayConfig.ts // this is for placeholder asset mode, image asset mode, and future asset metadata
            DebugDisplayConfig.ts // this is for right-side prototype HUD layout, debug colors, and debug overlay toggles

          types/ // this is for TypeScript types used by the V7 game layer
            CoordinateType.ts // this is for tile, screen, world, bounds, and area coordinate shapes
            DirectionType.ts // this is for direction names and movement delta types
            PlayerRoleType.ts // this is for Courier and Saboteur role constants
            CityTileType.ts // this is for terrain type, road class, path kind, feature kind, and road orientation values
            CityMapType.ts // this is for CityTile, generated map rows, map metadata, and generated map shape
            CityZoneType.ts // this is for zone id, zone bounds, and zone relation data
            TrafficSignalType.ts // this is for generated signal data and runtime signal state
            SaboteurHurdleType.ts // this is for hurdle types, activation request, active hurdle, placement result, and failure reasons
            MatchRuntimeStateType.ts // this is for Courier state, Saboteur state, tile interaction state, and local match state
            CityMapValidationType.ts // this is for map validation errors, warnings, issue codes, and generation stats
            MapAssetDisplayType.ts // this is for asset display mode and asset metadata types
            BackendCityMapPayloadType.ts // this is for backend-generated map payload received from /matches/{matchId}/map
            BackendMatchStatePayloadType.ts // this is for backend match state payload received from polling

          utility/ // this is for small pure helper functions
            PhaserColorConverter.ts // this is for converting #hex color strings into Phaser numeric colors
            CityTileKeyConverter.ts // this is for converting tile x/y to stable tile keys and back
            CityTileDistanceCalculator.ts // this is for Manhattan, Chebyshev, squared, and too-close tile distance checks
            DirectionDeltaResolver.ts // this is for converting direction names into tile movement deltas

          iso/ // this is for isometric coordinate conversion
            IsometricCoordinateCalculator.ts // this is for tile-to-world, world-to-tile, diamond points, tile centers, and tile depth

          backendAdapter/ // this is for converting backend payloads into frontend game objects
            BackendCityMapAdapter.ts // this is for converting backend-generated map payload into CityMapGenerated
            BackendMatchStateAdapter.ts // this is for converting backend match state into frontend runtime state shape
            BackendHurdleStateAdapter.ts // this is for converting active hurdle payloads into frontend active hurdle state
            BackendTrafficSignalStateAdapter.ts // this is for converting backend signal states into frontend traffic signal runtime state
            BackendResultAdapter.ts // this is for converting result payload into result screen display model

          cityMap/ // this is for generated map, runtime state, rules, rendering, camera, and input

            generation/ // this is for local prototype/debug generation only because backend is final map authority
              RandomSeededGenerator.ts // this is for deterministic seeded random numbers in local prototype
              CityMapEmptyFactory.ts // this is for creating empty building-based city map tiles in local prototype
              CityMapZoneBuilder.ts // this is for building 3 x 3 city zones and assigning zone ids to tiles in local prototype
              CityMapRoadPriorityRules.ts // this is for preventing lower-priority roads from replacing higher-priority roads in local prototype
              CityMapRoadNetworkGenerator.ts // this is for generating avenues, district roads, local roads, and main corridor in local prototype
              CityMapAreaGenerator.ts // this is for generating parks and lakes in unused building blocks in local prototype
              CityMapBridgeGenerator.ts // this is for generating bridges only over lake water in local prototype
              CityMapTunnelGenerator.ts // this is for generating walkable tunnels through building terrain in local prototype
              CityMapShortcutGenerator.ts // this is for generating subtle shorter but slower shortcut paths in local prototype
              CityMapStartDeliveryPlanner.ts // this is for placing start and delivery on valid normal roads in local prototype
              CityMapRoadIntersectionDetector.ts // this is for detecting road intersections for local prototype traffic signal planning
              CityMapTrafficSignalPlanner.ts // this is for placing green traffic signals in local prototype
              CityMapHurdleCandidatePlanner.ts // this is for marking hurdle candidates in local prototype
              CityMapValidator.ts // this is for validating local prototype maps
              CityMapGenerationBuilder.ts // this is for orchestrating local prototype map generation and retry
              CityMapGeneratedStore.ts // this is for storing current map, whether backend-loaded or locally generated

            runtime/ // this is for local runtime state stores used by Phaser scene
              MatchPrototypeState.ts // this is for creating local prototype state when not connected to backend
              TrafficSignalStateStore.ts // this is for initializing, activating, updating, and restoring signal states on client
              ActiveHurdleStateStore.ts // this is for storing active hurdles displayed on client
              CourierTrailStateStore.ts // this is for tracking tiles visited by Courier on client
              TileInteractionStateStore.ts // this is for hovered tile, selected tile, selected hurdle, and hover validation result
              ServerMatchRuntimeStore.ts // this is for storing latest server match state inside Phaser scene

            rules/ // this is for client-side prediction and UI validation, not final authority
              CourierMovementRules.ts // this is for local movement prediction and prototype movement checks
              MovementCostRules.ts // this is for calculating display movement costs and prototype movement timing
              SaboteurPlacementRules.ts // this is for client hover validation before sending hurdle API call
              ZonePlacementRules.ts // this is for highlighting likely allowed Saboteur zones
              HurdleSupportRules.ts // this is for checking tile support for selected hurdle on client
              TrafficSignalRules.ts // this is for checking traffic signal display and red-light UI behavior

            rendering/ // this is for Phaser drawing of map and runtime overlays
              CityMapRenderer.ts // this is for coordinating static map rendering and runtime overlay redraws
              TileBaseRenderer.ts // this is for drawing isometric diamond fills and outlines
              TileTerrainRenderer.ts // this is for drawing building, land, park, and water terrain
              TileRoadRenderer.ts // this is for drawing local roads, district roads, avenues, bridges, tunnels, and shortcuts
              TileFeatureRenderer.ts // this is for drawing start, delivery, traffic signals, tunnel hints, shortcut hints, and bridge hints
              AssetPlaceholderRenderer.ts // this is for drawing temporary placeholder buildings, signals, entrances, bridges, and hurdle icons
              AssetImageRenderer.ts // this is for drawing real image assets when enabled and loaded
              TileOverlayRenderer.ts // this is for drawing visited, hover, selected, and active hurdle overlays
              ZoneOverlayRenderer.ts // this is for drawing Courier current zone and Saboteur allowed zones
              CourierRenderer.ts // this is for drawing Courier body and always-visible outline
              MatchResultMarkerRenderer.ts // this is for optional visual markers when match ends

            camera/ // this is for Phaser camera behavior
              CameraGameController.ts // this is for camera setup, drag, zoom, Courier center, and zone focus
              CameraZoneViewCalculator.ts // this is for calculating zone world bounds and zoom-to-fit values

            input/ // this is for keyboard and pointer input handling
              CourierMovementInputController.ts // this is for arrow-key movement and held-key movement
              PointerTileInputResolver.ts // this is for converting pointer world position into city tile
              SaboteurHoverInputController.ts // this is for updating Saboteur hover tile and placement preview
              SaboteurPlacementInputController.ts // this is for selecting hurdle and sending placement action
              PrototypeRoleInputController.ts // this is for Tab role toggle in local prototype only
              ServerSyncedInputController.ts // this is for switching input behavior when match is backend-controlled

          scene/ // this is for Phaser scenes
            MapPrototypeScene.ts // this is for local prototype scene using local generation and debug controls
            MatchGameScene.ts // this is for real match scene using backend map payload and backend match state polling
            SceneLaunchDataType.ts // this is for data passed into Phaser scene such as matchId, role, difficulty, and map payload

          debug/ // this is for prototype-only debugging UI and overlays
            DebugTextOverlay.ts // this is for right-side role-specific prototype HUD panel
            DebugKeyboardShortcutController.ts // this is for debug shortcuts like role toggle or map regeneration in prototype
            DebugMapValidationRenderer.ts // this is for drawing map validation markers in prototype

      tests/ // this is for frontend unit and integration tests
        api/ // this is for API wrapper tests
          ApiClient.test.ts // this is for testing response envelope handling and API error handling
          AuthApi.test.ts // this is for testing auth API wrapper behavior
          MatchApi.test.ts // this is for testing match API wrapper behavior

        game/ // this is for Phaser-independent game logic tests
          IsometricCoordinateCalculator.test.ts // this is for testing tile/world conversion
          CityTileKeyConverter.test.ts // this is for testing tile key creation and parsing
          CityTileDistanceCalculator.test.ts // this is for testing distance helpers
          DirectionDeltaResolver.test.ts // this is for testing direction-to-delta mapping
          BackendCityMapAdapter.test.ts // this is for testing backend map payload conversion
          BackendMatchStateAdapter.test.ts // this is for testing backend match state conversion
          SaboteurPlacementRules.test.ts // this is for testing client-side placement preview rules
          CourierMovementRules.test.ts // this is for testing client-side movement preview rules

  backend/ // this is for plain PHP API backend

    public/ // this is for HTTP entry point
      index.php // this is for receiving all /api/v1 requests and loading the router

    api/ // this is for versioned API controllers
      v1/ // this is for version 1 API endpoints
        AuthController.php // this is for register, login, guest, refresh, logout, and guest forget endpoints
        ProfileController.php // this is for current profile and stats endpoint
        MapController.php // this is for current map metadata endpoint
        MatchController.php // this is for auto-join/create match and start match endpoints
        MatchMapController.php // this is for returning backend-generated match map snapshot
        MatchStateController.php // this is for polling current match state
        CourierActionController.php // this is for Courier move and ability endpoints
        SaboteurActionController.php // this is for Saboteur hurdle activation endpoint
        ResultController.php // this is for final match result endpoint

    config/ // this is for backend config values
      AppConfig.php // this is for app environment, API version, domain, and base runtime settings
      DbConfig.php // this is for MySQL host, database, username, password, charset, and timeout
      CacheConfig.php // this is for custom PHP cache server base URL, credentials, TTLs, and timeouts
      JwtConfig.php // this is for HS256 secret, issuer, audience, token expiry, cookie names, and cookie flags
      CsrfConfig.php // this is for CSRF token cookie/header names and validation behavior
      GameConfig.php // this is for general gameplay constants such as player count and supported roles
      DifficultyConfig.php // this is for Easy, Normal, Hard timer and route-help settings
      HurdleConfig.php // this is for hurdle duration, cooldown, energy cost, and max active values
      MapGenerationConfig.php // this is for backend map size, zones, road counts, feature counts, and validation settings

    constants/ // this is for stable string values and shared backend constants
      ApiErrorCodes.php // this is for stable API error codes
      HttpStatusCodes.php // this is for HTTP status code constants
      JwtClaimConstants.php // this is for JWT claim names such as sub, sid, jti, exp, iss, aud
      UserConstants.php // this is for username, name, email, and password validation constants
      MatchConstants.php // this is for match status, winner role, end reason, and state version constants
      RoleConstants.php // this is for Courier, Saboteur, Any role values
      DifficultyConstants.php // this is for Easy, Normal, Hard values
      AbilityConstants.php // this is for Speed Boost, Shield, Reveal Route values
      HurdleConstants.php // this is for supported Saboteur hurdle values
      MapConstants.php // this is for map version, generation version, width, height, and zone constants

    src/ // this is for backend application source code

      Http/ // this is for HTTP request and response handling
        Request.php // this is for parsed method, path, headers, cookies, query params, and JSON body
        JsonResponse.php // this is for standard JSON response object
        ResponseFactory.php // this is for building success and error response envelopes
        Router.php // this is for routing method and path to controller actions
        CookieFactory.php // this is for creating secure Set-Cookie headers for JWT and CSRF cookies

      Middleware/ // this is for request boundary checks before controllers call services
        JsonBodyMiddleware.php // this is for validating Content-Type and JSON body
        JwtCookieMiddleware.php // this is for validating access token cookie and creating AuthContext
        CsrfMiddleware.php // this is for checking X-CSRF-Token on mutating requests
        RateLimitMiddleware.php // this is for rate limiting by session or user through cache server
        IdempotencyMiddleware.php // this is for checking Idempotency-Key on mutating match requests

      Auth/ // this is for authentication and request identity
        AuthContext.php // this is for verified user id, session id, token id, guest flag, and display name
        AuthService.php // this is for register, login, guest creation, logout, and guest forget orchestration
        JwtTokenService.php // this is for creating and validating JWT access and refresh tokens
        RefreshTokenService.php // this is for validating refresh token sessions and rotating/refreshing access tokens
        CsrfTokenService.php // this is for issuing and validating CSRF tokens
        PasswordHasher.php // this is for hashing and verifying registered user passwords
        JwtSigner.php // this is for signing JWTs using HS256
        JwtVerifier.php // this is for verifying JWT signature, issuer, audience, expiry, sid, and jti

      Services/ // this is for application and gameplay business logic
        ProfileService.php // this is for fetching profile and deriving stats values
        MatchmakingService.php // this is for finding compatible waiting matches or creating a new match
        MatchService.php // this is for creating, joining, starting, ending, and reading matches
        MatchStateService.php // this is for reading/writing active match state in cache
        PollingStateService.php // this is for returning full or no-change match polling responses using stateVersion
        MapGenerationService.php // this is for generating official backend map snapshot for a match
        MapValidationService.php // this is for validating generated maps and action target tiles
        MovementService.php // this is for validating and applying Courier movement
        HurdleService.php // this is for validating and applying Saboteur hurdle placement
        AbilityService.php // this is for validating and applying Courier abilities
        ResultService.php // this is for computing winner, end reason, progress, and final summary
        StatsService.php // this is for updating registered user stats after match end
        CacheStateService.php // this is for reading/writing structured values to the custom cache server
        IdempotencyService.php // this is for preventing duplicate mutating action processing
        RateLimitService.php // this is for limiting auth, match, polling, and action request rates

      Repositories/ // this is for MySQL table access only
        CwUserRepository.php // this is for reading/writing cwusers registered and guest rows
        CwUserStatsRepository.php // this is for reading/writing cw_user_stats rows
        CwMatchHistoryRepository.php // this is for writing and reading cw_match_history rows

      Database/ // this is for database connection and SQL helpers
        DbManager.php // this is for opening PDO connection and managing database errors
        SqlExecutor.php // this is for running prepared statements safely
        TransactionRunner.php // this is for wrapping DB updates in transactions where needed

      Cache/ // this is for talking to the existing custom PHP in-memory cache server
        CacheClient.php // this is for calling cache server set/get/delete APIs
        CacheKeyFactory.php // this is for creating cache keys for match, map, idempotency, rate limit, and token metadata
        CacheTtlConfig.php // this is for cache TTL values for active match, map snapshot, idempotency, and rate limits

      MapGeneration/ // this is for backend-owned official map generation because Approach A is chosen
        RandomSeededGenerator.php // this is for deterministic backend random values
        CityMapEmptyFactory.php // this is for creating empty backend city map data
        CityMapZoneBuilder.php // this is for creating 3 x 3 zones and assigning zone ids
        CityMapRoadPriorityRules.php // this is for road class overwrite priority
        CityMapRoadNetworkGenerator.php // this is for generating avenues, district roads, local roads, and connected corridor
        CityMapAreaGenerator.php // this is for generating parks and lakes in unused building blocks
        CityMapBridgeGenerator.php // this is for generating bridges only over water
        CityMapTunnelGenerator.php // this is for generating walkable tunnels through building terrain
        CityMapShortcutGenerator.php // this is for generating subtle shortcut paths
        CityMapStartDeliveryPlanner.php // this is for placing start and delivery on valid roads
        CityMapRoadIntersectionDetector.php // this is for detecting road intersections
        CityMapTrafficSignalPlanner.php // this is for placing green traffic signals
        CityMapHurdleCandidatePlanner.php // this is for marking valid hurdle candidates
        CityMapValidator.php // this is for validating map reachability and sensible placement
        CityMapGenerationBuilder.php // this is for orchestrating backend map generation and retry
        CityMapSnapshotSerializer.php // this is for converting generated map into JSON payload for frontend/cache
        CityMapSnapshotHasher.php // this is for creating map hash/checksum for debugging consistency

      MapTypes/ // this is for backend map DTO-style array builders and constants
        CityTileShape.php // this is for documenting/creating backend tile array shape
        CityMapShape.php // this is for documenting/creating backend generated map array shape
        CityZoneShape.php // this is for documenting/creating backend zone array shape
        TrafficSignalShape.php // this is for documenting/creating backend generated signal array shape

      Rules/ // this is for backend authoritative gameplay rules
        CourierMovementRules.php // this is for checking walkable tile, blocked hurdles, red signals, and movement adjacency
        MovementCostRules.php // this is for calculating server movement cost and movement duration
        SaboteurPlacementRules.php // this is for checking distance, zone, cooldown, energy, and tile support
        ZonePlacementRules.php // this is for checking allowed placement zones based on Courier zone
        HurdleSupportRules.php // this is for checking which hurdle types a tile supports
        TrafficSignalRules.php // this is for checking red signal activation and expiry rules
        AbilityRules.php // this is for checking Courier ability cooldown and effects
        ResultRules.php // this is for checking delivery, timeout, lives zero, and cancellation result rules

      Mappers/ // this is for converting DB/cache/service data into API response shapes
        UserResponseMapper.php // this is for converting user row into safe API user response
        StatsResponseMapper.php // this is for adding derived stats to stored stats
        MatchStateResponseMapper.php // this is for converting cached match state into polling response
        MatchResultResponseMapper.php // this is for converting match history row into result API response
        CityMapResponseMapper.php // this is for converting generated map snapshot into API map response

      Validation/ // this is for reusable request validation
        AuthRequestValidator.php // this is for register, login, guest, refresh, logout, and forget validation
        MatchRequestValidator.php // this is for match create/start/poll request validation
        CourierActionRequestValidator.php // this is for Courier move and ability request validation
        SaboteurActionRequestValidator.php // this is for Saboteur hurdle request validation
        CommonFieldValidator.php // this is for username, email, password, matchId, coordinates, and clientActionId checks

      Utility/ // this is for small backend helper utilities
        Clock.php // this is for current time in ms and ISO UTC
        UlidFactory.php // this is for creating 26-character match ids
        HashFactory.php // this is for SHA-256 hashing of session id, JWT jti, refresh tokens, and other safe hashes
        JsonSafeEncoder.php // this is for safe JSON encoding with consistent errors
        Logger.php // this is for backend application logs without exposing secrets

    database/ // this is for MySQL migrations and seed data
      migrations/ // this is for ordered SQL schema changes
        001_create_cwusers.sql // this is for creating registered and guest users table
        002_create_cw_user_stats.sql // this is for creating stats and preference table
        003_create_cw_match_history.sql // this is for creating completed match summary table

      seeds/ // this is for optional local development seed data
        dev_users.sql // this is for optional local test registered users
        dev_match_history.sql // this is for optional local completed match examples

    tests/ // this is for backend tests
      unit/ // this is for service and rule unit tests
        AuthServiceTest.php // this is for register, login, guest, refresh, logout, and forget behavior
        JwtTokenServiceTest.php // this is for access token and refresh token signing/verification
        CsrfTokenServiceTest.php // this is for CSRF token creation and validation
        MatchmakingServiceTest.php // this is for auto-join waiting match logic
        MapGenerationServiceTest.php // this is for backend map generation stability and validation
        MovementServiceTest.php // this is for Courier movement validation and effects
        HurdleServiceTest.php // this is for Saboteur placement validation, cooldowns, and energy
        StatsServiceTest.php // this is for stored stats and derived stats updates
        PollingStateServiceTest.php // this is for stateVersion and no-change responses

      integration/ // this is for full API and DB/cache integration tests
        AuthApiIntegrationTest.php // this is for auth endpoint behavior with cookies
        MatchApiIntegrationTest.php // this is for match create/start/state/result behavior
        CourierActionApiIntegrationTest.php // this is for Courier movement API behavior
        SaboteurActionApiIntegrationTest.php // this is for Saboteur hurdle API behavior
        MatchResultIntegrationTest.php // this is for match history and stats persistence

    composer.json // this is for PHP autoloading and lightweight dependencies
    README.md // this is for backend setup, environment variables, API run instructions, and test instructions

  docs/ // this is for project documentation
    TAD_CourierWar.md // this is for main real-time two-player web game technical approach document
    TechnicalDesign_IsometricMapGeneration.md // this is for detailed map generation technical design
    ApiContract_CourierWar.md // this is for finalized API contracts if separated from TAD later
    DatabaseSchema_CourierWar.md // this is for database schema explanation and derived field notes
    CacheKeyPlan_CourierWar.md // this is for cache key names, TTLs, and cache server usage
    JwtAuthPlan_CourierWar.md // this is for JWT cookie auth, refresh flow, logout, guest forget, and CSRF details

  scripts/ // this is for local developer commands
    start-frontend.sh // this is for starting frontend dev server
    start-backend.sh // this is for starting plain PHP backend API server
    start-all.sh // this is for starting frontend, backend, and cache server in local dev
    test-frontend.sh // this is for running frontend tests
    test-backend.sh // this is for running backend tests
    db-migrate.sh // this is for applying MySQL migrations locally

  .env.example // this is for documenting required local environment variables without secrets
  README.md // this is for full project setup, running, testing, and development notes
  