// Importing loading icon and background images
import LoadingIcon from '../assets/images/loading-icon.png';
import LoadingBackground from '../assets/images/loading-background.png';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native'; // React Native components
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'; // React Native SafeAreaView component for handling safe area insets
import { MagnifyingGlassIcon, XMarkIcon } from 'react-native-heroicons/outline' // import hero icons library for search and cancel icon
import { CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/solid'
import { debounce } from "lodash"; 
import { theme } from '../theme';  // Theme-related utilities or styles
import { fetchLocations, fetchWeatherForecast } from '../api/weather';  // API functions for fetching weather data
import * as Progress from 'react-native-progress';  // React Native Progress component for displaying loading progress
import { StatusBar } from 'expo-status-bar';   // Expo StatusBar component for controlling the status bar appearance
import { weatherImages } from '../constants';
import { getData, storeData } from '../utils/asyncStorage';

// Define the HomeScreen component
export default function HomeScreen() {
  // State variables
  const [showSearch, toggleSearch] = useState(false);  // State for showing/hiding the search bar
  const [locations, setLocations] = useState([]);  // State to store the list of locations based on search
  const [loading, setLoading] = useState(true);    // State to track whether data is being loaded
  const [weather, setWeather] = useState({});    // State to store weather data
  const [progress, setProgress] = useState(0);   // State to control loading progress

  // Handler for search input
  const handleSearch = search => {
    if (search && search.length > 2)
      // Fetch locations based on the search
      fetchLocations({ cityName: search }).then(data => {
        setLocations(data);
      })
  }

  // Handler for selecting a location from the search results
  const handleLocation = loc => {
    setLoading(true);
    toggleSearch(false);
    setLocations([]);
    // Fetch weather forecast for the selected location
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7'
    }).then(data => {
      setLoading(false);
      setWeather(data);
      storeData('city', loc.name);
    })
  }

  // Fetch weather data for the user's default city on component mount
  useEffect(() => {
    fetchMyWeatherData();
  }, []);

  // Function to fetch weather data for the user's default city
  const fetchMyWeatherData = async () => {
    let myCity = await getData('city');
    let cityName = 'Kelaniya';
    if (myCity) {
      cityName = myCity;
    }
    fetchWeatherForecast({
      cityName,
      days: '7'
    }).then(data => {
      setWeather(data);
      setLoading(false);
    })
  }

  // Function to get the current day name
  const getCurrentDate = () => {
    const currentDate = new Date();
    const options = { weekday: 'long' };
    return currentDate.toLocaleDateString('en-US', options);
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 500), []);

  //current data from the weather state
  const { location, current } = weather;
{/* Loading bar progress */}
  // Function to simulate loading progress
  const simulateLoading = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 1 ? prev + 0.1 : 1));
    }, 500);

    // Simulate API call duration
    setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
    }, 3000); // Adjust the duration as needed
  };

  useEffect(() => {
    simulateLoading();
    fetchMyWeatherData();
  }, []);

  // Render the component
  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      <Image
        source={require('../assets/images/background.png')}
        className="absolute w-full h-full" />

      {loading ? (
        // Show loading indicator while data is being fetched
        <View className="flex-1 justify-center items-center">
        <Image source={LoadingBackground} className="absolute w-full h-full" />
        <View style={{ marginBottom: 10 }}>
        <Image source={LoadingIcon} style={{ width: 200, height: 200 }} /> 
        </View>
        <View style={{ marginBottom: 20 }}>
        <Text className="font-semibold text-white text-left text-4xl font-">Weather</Text>
        </View>
      <Progress.Bar progress={progress} width={230} color="#0bb3b2" />
  </View>
      ) : (
        // Display weather information when data is available
        <SafeAreaView className="flex flex-1">
          {/* Header */}
          <View className="mx-6 mt-7 mb-2">
            <Text className="font-semibold text-white text-left text-3xl font-">Weather</Text>
          </View>

          {/* Search section */}
          <View style={{ height: '8%', marginHorizontal: 16, position: 'relative', zIndex: 55 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', borderRadius: 8, backgroundColor: theme.bgWhite(0.2) }}>
    <TextInput
      onChangeText={handleTextDebounce}
      placeholder="Search city"
      placeholderTextColor={'white'}
      style={{ paddingLeft: 15, height: 40, paddingBottom: 1, flex: 1, fontSize: 18, color: 'white' }}
    />
    <TouchableOpacity
      onPress={() => {
        // Dismiss the keyboard when MagnifyingGlassIcon is pressed
        Keyboard.dismiss();
        toggleSearch(!showSearch);
      }}
      style={{ borderRadius: 8, padding: 10, margin: 1, backgroundColor: theme.bgWhite(0) }}
    >
      {showSearch ? <XMarkIcon size={25} color="white" /> : <MagnifyingGlassIcon size={25} color="white" />}
    </TouchableOpacity>
  </View>
  {/* Display search results if available */}
  {locations.length > 0 && showSearch ? (
    <View style={{ position: 'absolute', width: '100%', backgroundColor: '#d1d5db', top: 50, borderRadius: 20, zIndex: 1000 }}>
      {locations.map((loc, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            // Dismiss the keyboard when selecting a location
            Keyboard.dismiss();
            handleLocation(loc);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 14, borderBottomWidth: index + 1 !== locations.length ? 2 : 0, borderBottomColor: 'gray' }}
        >
          <MapPinIcon size={20} color="gray" />
          <Text style={{ color: 'black', fontSize: 18, marginLeft: 8 }}>{loc?.name}, {loc?.country}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null}
</View>

          {/* Weather information */}
          <View className="mx-4 flex justify-around flex-1 mb-2 mt-[-10px]">
            {/* Location and Date */}
            <Text className="font-bold text-white text-center text-3xl">
              {location?.name},
              <Text> </Text>
              <Text className="text-lg font-light text-white">{location?.country}</Text>
            </Text>
            <Text className="text-white text-center text-lg mt-[-40px]">
              {getCurrentDate()}
            </Text>

            {/* Weather Icon */}
            <View className="flex-row justify-center">
              <Image
                source={weatherImages[current?.condition?.text || 'other']}
                className="w-52 h-52 mb-[-30px]" />
            </View>

            {/* Temperature */}
            <View className="space-y-[-6px]">
              <Text className="text-center font-bold text-white text-7xl ml-5">
              {Math.floor(current?.temp_c)}&#176;C
              </Text>
              <Text className="text-center text-white text-xl tracking-widest">
                {current?.condition?.text}
              </Text>
            </View>

            {/* Other Stats */}
            <View className="flex-row justify-between mx-4 mt-[-10px]">
              {/* Wind */}
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/icons/wind.png')} className="w-6 h-6" />
                <Text className="text-white font-semibold text-base">{current?.wind_kph}km</Text>
              </View>

              {/* Sunrise */}
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/icons/sun.png')} className="w-6 h-6" />
                <Text className="text-white font-semibold text-base">
                  {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                </Text>
              </View>

              {/* Humidity */}
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/icons/drop.png')} className="w-6 h-6" />
                <Text className="text-white font-semibold text-base">{current?.humidity}%</Text>
              </View>
            </View>
          </View>

          {/* Forecast for next days */}
          <View className="mb-6 space-y-3">
            <ScrollView
              horizontal
              contentContainerStyle={{ paddingHorizontal: 15 }}
              showsHorizontalScrollIndicator={false}
            >
              {/* Display forecast for each day */}
              {weather?.forecast?.forecastday?.map((item, index) => {
                const date = new Date(item.date);
                const options = { weekday: 'long' };
                let dayName = date.toLocaleDateString('en-US', options);
                dayName = dayName.split(',')[0];

              return (
                  <View
                    key={index}
                    className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
                    style={{ backgroundColor: theme.bgWhite(0.15) }}
                  >
                    <Text className="text-white">{dayName}</Text>
                    <Image
                      source={weatherImages[item?.day?.condition?.text || 'other']}
                      className="w-11 h-11" />
                    <Text className="text-white text-xl font-semibold">
                    {Math.floor(item?.day?.avgtemp_c)}&#176;C
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      )}
    </View>
  )
}
