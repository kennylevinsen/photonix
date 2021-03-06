import React  from 'react'
import { Query } from "react-apollo"
import gql from "graphql-tag"
import Filters from '../components/Filters'
import Spinner from '../components/Spinner'


const GET_FILTERS = gql`
  {
    allLocationTags {
      id
      name
    }
    allObjectTags {
      id
      name
    }
    allPersonTags {
      id
      name
    }
    allColorTags {
      id
      name
    }
    allStyleTags {
      id
      name
    }
    allCameras {
      id
      make
      model
    }
    allLenses {
      id
      name
    }
    allApertures
    allExposures
    allIsoSpeeds
    allFocalLengths
    allMeteringModes
    allDriveModes
    allShootingModes
  }
`

export default class FiltersContainer extends React.Component {
  constructor(props) {
    super(props)

    this.padding = 40
    this.scrollbarHandleWidth = 200

    this.containerRef = React.createRef()
    this.scrollbarHandleRef = React.createRef()
    this.initialised = false

    this.mouseDownStart = 0
    this.dragOffset = 0
    this.scrollbarWidth = 0
    this.contentWidth = 0
    this.contentScrollRange = 0
    this.contentOffset = 0
    this.scrollProgress = 0
    this.contentLeft = 0
    this.contentViewLeft = 0
    this.scrollbarLeft = 0
    this.displayScrollbar = false

    this.state = {
      displayScrollbar: this.displayScrollbar,
    }
  }

  componentDidMount = () => {
    window.addEventListener('resize', this.onWindowResize)
  }
  componentWillUnmount = () => {
    window.removeEventListener('resize', this.onWindowResize)
  }

  componentDidUpdate = () => {
    if (!this.initialised && this.containerRef.current && this.scrollbarHandleRef.current) {
      this.forceUpdate(this.init())
    }
    else if (!this.initialised) {
      // Occasionally we get refs before the painting has completed so we have to force an update
      setTimeout(() => {this.forceUpdate()}, 100)
    }
  }

  init = () => {
    this.calculateSizes()
    this.positionScrollbar()
  }

  calculateSizes = () => {
    this.padding = 40
    this.scrollbarHandleWidth = 200
    if (window.innerWidth < 700) {
      this.padding = 20
      this.scrollbarHandleWidth = 100
    }

    if (this.containerRef.current) {
      this.contentWidth = this.containerRef.current.firstChild.clientWidth + this.padding
      this.contentViewWidth = this.containerRef.current.clientWidth + (2 * this.padding)
      this.contentScrollRange = this.contentWidth - this.contentViewWidth + (2 * this.padding)
      this.scrollbarWidth = this.containerRef.current.parentElement.clientWidth
      this.scrollbarScrollRange = this.scrollbarWidth - this.scrollbarHandleWidth
    }
  }

  positionScrollbar = () => {
    if (this.containerRef.current) {
      this.contentOffset = this.containerRef.current.scrollLeft
      this.scrollProgress = this.contentOffset / this.contentScrollRange
      this.scrollbarLeft = parseInt((this.padding) + (this.scrollProgress * this.scrollbarScrollRange), 10)
      this.scrollbarHandleRef.current.style.left = this.scrollbarLeft + 'px'
      this.scrollbarHandleRef.current.style.width = this.scrollbarHandleWidth + 'px'
      this.initialised = true
    }
  }

  positionViewport = () => {
    this.scrollProgress = this.dragOffset / this.scrollbarScrollRange
    this.contentLeft = parseInt(this.scrollProgress * this.contentScrollRange, 10)
    this.containerRef.current.scrollLeft = this.contentLeft
    this.positionScrollbar()
  }

  onScroll = () => {
    this.positionScrollbar()
  }

  onMouseDown = (e) => {
    e.preventDefault()
    this.mouseDownStart = e.clientX
    this.scrollbarStart = this.scrollbarHandleRef.current.offsetLeft | 0
    document.onmouseup = this.scrollbarRelease
    document.onmousemove = this.scrollbarDrag
    this.setState({displayScrollbar: true})
  }

  onTouchStart = (e) => {
    this.mouseDownStart = e.touches[0].clientX
    this.scrollbarStart = this.scrollbarHandleRef.current.offsetLeft | 0
    document.ontouchend = this.scrollbarRelease
    document.ontouchmove = this.scrollbarDragTouch
  }

  onWindowResize = () => {
    this.calculateSizes()
    this.positionScrollbar()
  }

  scrollbarRelease = () => {
    document.onmouseup = null
    document.onmousemove = null
    document.ontouchend = null
    document.ontouchmove = null
    this.setState({displayScrollbar: false})
  }

  scrollbarDrag = (e) => {
    e.preventDefault()
    this.dragOffset = e.clientX - (this.mouseDownStart - this.scrollbarStart) - this.padding
    this.positionViewport()
  }

  scrollbarDragTouch = (e) => {
    this.dragOffset = e.touches[0].clientX - (this.mouseDownStart - this.scrollbarStart) - this.padding
    this.positionViewport()
  }

  createFilterSelection = (sectionName, data, prefix='tag') => {
    return {
      name: sectionName,
      items: data.map((tag) => {
        if (tag.toString() === '[object Object]') {
          return {id: prefix + ':' + tag.id, name: tag.name}
        }
        return {id: prefix + ':' + tag, name: tag}
      }),
    }
  }

  render = () => {
    return <div>
      <Query query={GET_FILTERS}>
        {({ loading, error, data }) => {
          if (loading) return <Spinner />
          if (error) return <p>Error :(</p>

          let filterData = []
          if (data.allObjectTags.length) {
            filterData.push(this.createFilterSelection('Objects', data.allObjectTags))
          }
          if (data.allLocationTags.length) {
            filterData.push(this.createFilterSelection('Locations', data.allLocationTags))
          }
          if (data.allPersonTags.length) {
            filterData.push(this.createFilterSelection('People', data.allPersonTags))
          }
          if (data.allColorTags.length) {
            filterData.push(this.createFilterSelection('Colors', data.allColorTags))
          }
          if (data.allStyleTags.length) {
            filterData.push(this.createFilterSelection('Styles', data.allStyleTags))
          }
          if (data.allCameras.length) {
            filterData.push({
              name: 'Cameras',
              items: data.allCameras.map((camera) => (
                {id: 'camera:' + camera.id, name: `${camera.make} ${camera.model}`}
              )),
            })
          }
          if (data.allLenses.length) {
            filterData.push(this.createFilterSelection('Lenses', data.allLenses, 'lens'))
          }
          if (data.allApertures.length) {
            filterData.push(this.createFilterSelection('Aperture', data.allApertures, 'aperture'))
          }
          if (data.allExposures.length) {
            filterData.push(this.createFilterSelection('Exposure', data.allExposures, 'exposure'))
          }
          if (data.allIsoSpeeds.length) {
            filterData.push(this.createFilterSelection('ISO Speed', data.allIsoSpeeds, 'isoSpeed'))
          }
          if (data.allFocalLengths.length) {
            filterData.push(this.createFilterSelection('Focal Length', data.allFocalLengths, 'focalLength'))
          }
          filterData.push({
            name: 'Flash',
            items: [{id: 'flash:on', name: 'On'}, {id: 'flash:off', name: 'Off'}]
          })
          if (data.allMeteringModes.length) {
            filterData.push(this.createFilterSelection('Metering Mode', data.allMeteringModes, 'meeteringMode'))
          }
          if (data.allDriveModes.length) {
            filterData.push(this.createFilterSelection('Drive Mode', data.allDriveModes, 'driveMode'))
          }
          if (data.allShootingModes.length) {
            filterData.push(this.createFilterSelection('Shooting Mode', data.allShootingModes, 'shootingMode'))
          }

          return <Filters
            data={filterData}
            onToggle={this.props.onFilterToggle}
            onScroll={this.onScroll}
            onMouseDown={this.onMouseDown}
            onTouchStart={this.onTouchStart}
            containerRef={this.containerRef}
            scrollbarHandleRef={this.scrollbarHandleRef}
            displayScrollbar={this.state.displayScrollbar} />
        }}
      </Query>
    </div>
  }
}
