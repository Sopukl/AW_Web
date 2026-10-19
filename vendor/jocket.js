/* Generated from qtrogl/sources/Jocket/Classifier.h and Classifier.cpp. Jocket only. */
(function (root) {
  root.JOCKET = {
  "enginery": {
    "SwitchingLight": [
      "On",
      "GroupOn",
      "BrightnessLevel",
      "GroupLevel",
      "Power",
      "Chart"
    ],
    "DimmingLight": [
      "On",
      "GroupOn",
      "BrightnessLevel",
      "GroupLevel",
      "Power",
      "Chart"
    ],
    "RgbLight": [
      "On",
      "GroupOn",
      "BrightnessLevel",
      "GroupLevel",
      "Color",
      "Power",
      "Chart"
    ],
    "RgbwLight": [
      "On",
      "GroupOn",
      "BrightnessLevel",
      "GroupLevel",
      "Color",
      "Power",
      "Chart"
    ],
    "DynamicLight": [
      "On",
      "GroupOn",
      "ScenarioIndex"
    ],
    "LightSensor": [
      "On",
      "CurrentLuminosity"
    ],
    "PresenceSensor": [
      "On",
      "CurrentPresence",
      "HoldTime"
    ],
    "LightingArea": [
      "On",
      "Discovery",
      "TuningType",
      "OccupancyLevel",
      "VacancyLevel",
      "TargetLuminosity",
      "Hysteresis",
      "TuningSpeed",
      "OccupancyAction",
      "OccupancyScene",
      "VacancyAction",
      "VacancyScene",
      "Presence",
      "Luminosity",
      "Pause",
      "CurrentProfile",
      "Profiles",
      "HoldTime",
      "VacancySceneLoad",
      "VacancySceneSave",
      "OccupancySceneLoad",
      "OccupancySceneSave",
      "Buttons",
      "OccupancySceneLevels",
      "VacancySceneLevels",
      "VirtualPresence",
      "VirtualLuminosity"
    ],
    "EmergencyUnit": [
      "On",
      "GroupOn",
      "BrightnessLevel",
      "GroupLevel",
      "ChargeLevel",
      "Mode",
      "FunctionTest",
      "FunctionAutoTestOn",
      "LastFunctionTestInfo",
      "DurationTest",
      "DurationAutoTestOn",
      "LastDurationTestInfo"
    ],
    "TunableWhiteLight": [
      "On",
      "GroupOn",
      "BrightnessLevel",
      "GroupLevel",
      "Temperature",
      "Power",
      "Chart"
    ],
    "TemperatureSensor": [
      "Temperature",
      "Chart"
    ],
    "Thermoregulator": [
      "On",
      "TargetTemperature",
      "Preset",
      "Mode",
      "FanSpeedMode",
      "LouverMode"
    ],
    "Fan": [
      "On"
    ],
    "HeatedFloor": [
      "On"
    ],
    "Scenario": [
      "On"
    ],
    "IntruderSensor": [
      "Triggered",
      "Guard"
    ],
    "FireSensor": [
      "Triggered"
    ],
    "LeakageSensor": [
      "Triggered"
    ],
    "Shutter": [
      "Motion",
      "PositionLevel"
    ],
    "Curtain": [
      "Motion",
      "PositionLevel"
    ],
    "Blind": [
      "Motion",
      "PositionLevel",
      "Rotation",
      "PositionAngle"
    ],
    "Dashboard": [
      "Title",
      "Surfaces",
      "Url"
    ],
    "Portal": [
      "Title",
      "Surfaces",
      "Url",
      "LocationID"
    ],
    "Indicator": [
      "Title",
      "Surfaces",
      "Metrics",
      "Alarms",
      "Charts"
    ],
    "Button": [
      "Title",
      "Surfaces",
      "On"
    ],
    "Selector": [
      "Title",
      "Surfaces",
      "Mode"
    ],
    "Regulator": [
      "Title",
      "Surfaces",
      "Level"
    ],
    "Editor": [
      "Title",
      "Surfaces",
      "Forms"
    ],
    "ColdWaterMeter": [
      "Volume"
    ],
    "HotWaterMeter": [
      "Volume"
    ],
    "WasteWaterMeter": [
      "Volume"
    ],
    "VentilationUnit": [
      "On",
      "TargetTemperature",
      "OperationMode",
      "ThermalMode",
      "FanSpeed",
      "Failure",
      "Status",
      "Scheduled",
      "Remote",
      "NoInputVoltage"
    ],
    "ElectricAirHeater": [
      "On",
      "PowerLevel",
      "Overheat"
    ],
    "WaterAirHeater": [
      "Status",
      "FreezingThreat"
    ],
    "WaterAirCooler": [
      "Status",
      "FreezingThreat"
    ],
    "InflowDuctFan": [
      "On",
      "Chart",
      "RunningTime",
      "ConverterFrequency",
      "ConverterAmperage",
      "VelocityLevel",
      "Overheat",
      "NoPressureDrop"
    ],
    "OutflowDuctFan": [
      "On",
      "Chart",
      "RunningTime",
      "ConverterFrequency",
      "ConverterAmperage",
      "VelocityLevel",
      "Overheat",
      "NoPressureDrop"
    ],
    "InflowAirValve": [
      "Motion",
      "PositionLevel",
      "Chart"
    ],
    "OutflowAirValve": [
      "Motion",
      "PositionLevel",
      "Chart"
    ],
    "InflowAirFilter": [
      "Dirty"
    ],
    "OutflowAirFilter": [
      "Dirty"
    ],
    "HeaterWaterValve": [
      "PositionLevel",
      "Chart"
    ],
    "CoolerWaterValve": [
      "PositionLevel",
      "Chart"
    ],
    "HeaterWaterPump": [
      "On",
      "Chart",
      "RunningTime",
      "Overheat"
    ],
    "CoolerWaterPump": [
      "On",
      "Chart",
      "RunningTime",
      "Overheat"
    ],
    "DuctTemperatureSensor": [
      "Temperature",
      "Chart",
      "Failure"
    ],
    "ImmersionTemperatureSensor": [
      "Temperature",
      "Chart",
      "Failure"
    ],
    "PlateRecuperator": [
      "FreezingThreat"
    ],
    "RotorRecuperator": [
      "On",
      "RecuperationLevel",
      "FreezingThreat"
    ],
    "CoolantRecuperator": [
      "On",
      "RecuperationLevel",
      "FreezingThreat"
    ],
    "BypassRecuperator": [
      "BypassLevel",
      "FreezingThreat"
    ],
    "DuctHumidifier": [
      "On"
    ],
    "DuctHumiditySensor": [
      "Humidity",
      "Chart",
      "Failure"
    ],
    "AirDifferentialPressureSensor": [
      "PressureDrop",
      "Chart",
      "Failure"
    ],
    "CapillaryThermostat": [
      "Triggered"
    ],
    "MeetingRoom": [
      "Capacity",
      "Equipment"
    ]
  },
  "subginery": {
    "Lighting": [
      "On",
      "Off",
      "Scene1On",
      "Scene2On",
      "Power",
      "LightSensorsOn",
      "LightSensorsOff",
      "PresenceSensorsOn",
      "PresenceSensorsOff",
      "Chart",
      "SaveScene",
      "SceneOn",
      "BrightnessLevel"
    ],
    "Access": [],
    "Multiroom": [],
    "Water": [],
    "Climate": [
      "ThermoregulatorsOn",
      "TargetTemperature",
      "Preset",
      "Mode",
      "FanSpeedMode",
      "LouverMode",
      "Temperature",
      "HeatedFloorsOn",
      "FansOn",
      "Chart"
    ],
    "Handling": [],
    "Alarm": [
      "IntruderSensorsGuard"
    ],
    "Mechanics": [],
    "Air": [],
    "Coworking": [],
    "Shading": [
      "Motion",
      "PositionLevel",
      "Rotation",
      "PositionAngle"
    ],
    "Generics": [],
    "Heating": [],
    "Cooling": [],
    "Electricity": [],
    "Gas": []
  },
  "manager": {
    "Dali": [
      "Bus"
    ]
  },
  "provider": {
    "DaliDimmer": [
      "On",
      "BrightnessLevel",
      "Address",
      "Types",
      "Discovery",
      "CurrentLevelRaw",
      "PhysicalMinLevelRaw",
      "MinLevelRaw",
      "MaxLevelRaw",
      "PowerOnLevelRaw",
      "SystemFailureLevelRaw",
      "SceneLevelsRaw",
      "Groups",
      "FadeTime",
      "FadeRate",
      "DimmingCurve",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "Tuning",
      "Binding",
      "BindingDevice",
      "BindingGroup"
    ],
    "DaliRelay": [
      "On",
      "BrightnessLevel",
      "Address",
      "Types",
      "Discovery",
      "CurrentLevelRaw",
      "PhysicalMinLevelRaw",
      "MinLevelRaw",
      "MaxLevelRaw",
      "PowerOnLevelRaw",
      "SystemFailureLevelRaw",
      "SceneLevelsRaw",
      "Groups",
      "FadeTime",
      "FadeRate",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "Tuning",
      "Binding",
      "BindingDevice",
      "BindingGroup"
    ],
    "DaliTunableWhite": [
      "On",
      "BrightnessLevel",
      "Address",
      "Types",
      "Discovery",
      "CurrentLevelRaw",
      "PhysicalMinLevelRaw",
      "MinLevelRaw",
      "MaxLevelRaw",
      "PowerOnLevelRaw",
      "SystemFailureLevelRaw",
      "SceneLevelsRaw",
      "Groups",
      "FadeTime",
      "FadeRate",
      "DimmingCurve",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "Tuning",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "Temperature",
      "Warmest",
      "Coolest"
    ],
    "DaliLightSensor": [
      "On",
      "Discovery",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "Address",
      "OperationMode",
      "Groups",
      "Group0",
      "Group1",
      "Group2",
      "EventScheme",
      "EventPriority",
      "EventFilter",
      "DeadTime",
      "ReportTime",
      "Hysteresis",
      "HysteresisMin",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "InstancesNumber",
      "InstanceIndex",
      "InstanceType",
      "FeatureTypes",
      "Resolution",
      "RawEvent",
      "CurrentLuminosity"
    ],
    "DaliPresenceSensor": [
      "On",
      "Discovery",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "Address",
      "OperationMode",
      "Groups",
      "Group0",
      "Group1",
      "Group2",
      "EventScheme",
      "EventPriority",
      "EventFilter",
      "DeadTime",
      "ReportTime",
      "HoldTime",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "InstancesNumber",
      "InstanceIndex",
      "InstanceType",
      "FeatureTypes",
      "Resolution",
      "RawEvent",
      "CurrentPresence",
      "EngineryHoldTime",
      "Catching"
    ],
    "DaliPushButton": [
      "On",
      "Discovery",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "Address",
      "OperationMode",
      "Groups",
      "Group0",
      "Group1",
      "Group2",
      "EventScheme",
      "EventPriority",
      "EventFilter",
      "ShortTime",
      "ShortTimeMin",
      "DoubleTime",
      "DoubleTimeMin",
      "RepeatTime",
      "StuckTime",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "InstancesNumber",
      "InstanceIndex",
      "InstanceType",
      "FeatureTypes",
      "Resolution",
      "RawEvent",
      "LastEvent"
    ],
    "DaliRgbwaf": [
      "On",
      "BrightnessLevel",
      "Address",
      "Types",
      "Discovery",
      "CurrentLevelRaw",
      "PhysicalMinLevelRaw",
      "MinLevelRaw",
      "MaxLevelRaw",
      "PowerOnLevelRaw",
      "SystemFailureLevelRaw",
      "SceneLevelsRaw",
      "Groups",
      "FadeTime",
      "FadeRate",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "Tuning",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "ChannelsCount",
      "Color"
    ],
    "DaliEmergency": [
      "On",
      "BrightnessLevel",
      "Address",
      "Types",
      "Discovery",
      "CurrentLevelRaw",
      "PhysicalMinLevelRaw",
      "MinLevelRaw",
      "MaxLevelRaw",
      "PowerOnLevelRaw",
      "SystemFailureLevelRaw",
      "SceneLevelsRaw",
      "Groups",
      "FadeTime",
      "FadeRate",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "Tuning",
      "ChargeLevel",
      "FunctionTestDate",
      "DurationTestDate",
      "FunctionTestStatus",
      "DurationTestStatus",
      "EmergencyLevelRaw",
      "EmergencyMinLevelRaw",
      "EmergencyMaxLevelRaw",
      "DaysBetweenFunctionTest",
      "WeeksBetweenDurationTest",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "ChargeLevelRaw",
      "EmergencyMode",
      "EmergencyStatus",
      "HardwiredSettings",
      "FailureStatus",
      "DurationTestResult",
      "RatedDuration",
      "UntilNextFunctionTest",
      "UntilNextDurationTest"
    ],
    "DaliMotor": [
      "On",
      "BrightnessLevel",
      "Address",
      "Types",
      "Discovery",
      "CurrentLevelRaw",
      "PhysicalMinLevelRaw",
      "MinLevelRaw",
      "MaxLevelRaw",
      "PowerOnLevelRaw",
      "SystemFailureLevelRaw",
      "SceneLevelsRaw",
      "Groups",
      "FadeTime",
      "FadeRate",
      "Gtin",
      "Serial",
      "GtinOem",
      "SerialOem",
      "FirmwareVersion",
      "HardwareVersion",
      "Tuning",
      "Binding",
      "BindingDevice",
      "BindingGroup",
      "Motion",
      "PositionLevel"
    ],
    "LomDimmer": [
      "BrightnessLevel",
      "Time",
      "OperTime",
      "Latitude",
      "Longitude",
      "Altitude",
      "Tilt",
      "Illumination",
      "Temp",
      "TempMin",
      "TempMax"
    ],
    "KnxDimmer": [
      "BrightnessLevel"
    ],
    "KnxRelay": [
      "BrightnessLevel"
    ],
    "KnxMotor": [
      "Motion",
      "PositionLevel"
    ],
    "KnxTemperatureSensor": [
      "Temperature"
    ]
  },
  "subgineryTypes": [
    "Lighting",
    "Access",
    "Multiroom",
    "Water",
    "Climate",
    "Handling",
    "Alarm",
    "Mechanics",
    "Air",
    "Coworking",
    "Shading",
    "Generics",
    "Heating",
    "Cooling",
    "Electricity",
    "Gas"
  ],
  "engineryTypes": [
    "SwitchingLight",
    "DimmingLight",
    "RgbLight",
    "RgbwLight",
    "DynamicLight",
    "LightSensor",
    "PresenceSensor",
    "LightingArea",
    "EmergencyUnit",
    "TunableWhiteLight",
    "TemperatureSensor",
    "Thermoregulator",
    "Fan",
    "HeatedFloor",
    "Scenario",
    "IntruderSensor",
    "FireSensor",
    "LeakageSensor",
    "Shutter",
    "Curtain",
    "Blind",
    "Dashboard",
    "Portal",
    "Indicator",
    "Button",
    "Selector",
    "Regulator",
    "Editor"
  ]
};
})(typeof window !== 'undefined' ? window : globalThis);
