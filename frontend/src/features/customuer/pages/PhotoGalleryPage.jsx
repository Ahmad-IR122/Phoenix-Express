import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import './PhotoGalleryPage.css';
import deliveryImg from "../../../Images/delivery.png";
import fleetImg from "../../../Images/fleet.png";
import customersImg from "../../../Images/customers.png";
import API from "../../../apis/api";

const PhotoGalleryPage = () => {
  const fallbackGalleryItems = [
    {
      id: 1,
      title: "خدمات التوصيل الاحترافية",
      desc: "نوصل طرودكم بأمان وسرعة",
      img: deliveryImg,
    },
    {
      id: 2,
      title: "أسطول متكامل",
      desc: "نمتلك أسطولاً حديثاً من المركبات",
      img: fleetImg,
    },
    {
      id: 3,
      title: "عملاء سعداء",
      desc: "رضا عملائنا هو هدفنا الأول",
      img: customersImg,
    },
  ];
  const [cmsGalleryItems, setCmsGalleryItems] = React.useState([]);
  const galleryItems = cmsGalleryItems.length ? cmsGalleryItems : fallbackGalleryItems;

  React.useEffect(() => {
    API.get("/photogalleries")
      .then((response) => {
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        setCmsGalleryItems(
          items.map((item) => ({
            id: item.id,
            title: item.name,
            desc: item.description || "",
            img: item.image_url,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div className="photo-gallery-page">
      {/* SECTION 1: PHOTO GALLERY */}
      <Container className="py-5">
        <div className="section-header text-center mb-5">
          <h2 className="gallery-main-title">معرض الصور</h2>
          <p className="gallery-subtitle">صور من أعمالنا وخدماتنا المتميزة</p>
        </div>

        <Row className="g-4">
          {galleryItems.map((item) => (
            <Col key={item.id} lg={4} md={6} xs={12}>
              <Card className="gallery-card border-0">
                <div className="img-zoom-container">
                  <Card.Img src={item.img} alt={item.title} />
                  <div className="card-overlay">
                    <h4 className="overlay-title">{item.title}</h4>
                    <p className="overlay-desc">{item.desc}</p>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* SECTION 2: INFO CARDS */}
        <Row className="info-section-row g-4 mt-5">
          {/* Right Card: Professional Team (Blue) */}
          <Col lg={6} className="d-flex">
            <div className="info-card team-card">
              <h3 className="info-title">فريق عمل محترف</h3>
              <p className="info-text">
                نفخر بفريقنا المدرب والمحترف الذي يعمل على مدار الساعة لضمان وصول طرودكم بأمان وفي الوقت المحدد.
              </p>
              <div className="photo-gallery-stats-row">
                <div className="photo-gallery-stat-item">
                  <span className="photo-gallery-stat-number">50+</span>
                  <span className="photo-gallery-stat-label">موظف</span>
                </div>

                <div className="photo-gallery-stat-item">
                  <span className="photo-gallery-stat-number">20+</span>
                  <span className="photo-gallery-stat-label">مركبة</span>
                </div>

                <div className="photo-gallery-stat-item">
                  <span className="photo-gallery-stat-number">24/7</span>
                  <span className="photo-gallery-stat-label">خدمة</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Left Card: Comprehensive Coverage (White) */}
          <Col lg={6} className="d-flex">
            <div className="info-card coverage-card">
              <h3 className="info-title blue-text">تغطية شاملة</h3>
              <p className="info-text gray-text">
                نغطي جميع المناطق في فلسطين، من الضفة الغربية إلى القدس والداخل، لضمان وصول خدماتنا لجميع عملائنا.
              </p>
              <ul className="coverage-list">
                <li>الضفة الغربية - جميع المدن</li>
                <li>القدس وضواحيها</li>
                <li>الداخل المحتل</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PhotoGalleryPage;
