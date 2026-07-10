import React from 'react'
import Svg, { Polygon, Circle } from 'react-native-svg'

export default function OccitanCross({ size = 84, color = '#F5C518' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 120 120">
            <Polygon
                points="47,47 38,20 82,20 73,47 100,38 100,82 73,73 82,100 38,100 47,73 20,82 20,38"
                fill={color}
            />
            <Circle cx="60" cy="20" r="8" fill={color} />
            <Circle cx="38" cy="20" r="8" fill={color} />
            <Circle cx="82" cy="20" r="8" fill={color} />
            <Circle cx="100" cy="38" r="8" fill={color} />
            <Circle cx="100" cy="60" r="8" fill={color} />
            <Circle cx="100" cy="82" r="8" fill={color} />
            <Circle cx="82" cy="100" r="8" fill={color} />
            <Circle cx="60" cy="100" r="8" fill={color} />
            <Circle cx="38" cy="100" r="8" fill={color} />
            <Circle cx="20" cy="82" r="8" fill={color} />
            <Circle cx="20" cy="60" r="8" fill={color} />
            <Circle cx="20" cy="38" r="8" fill={color} />
        </Svg>
    )
}
